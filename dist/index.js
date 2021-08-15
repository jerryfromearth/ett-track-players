"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const cellsTemplate = ["links", "id", "name", "elo", "online", "opponent"];
class Player {
    constructor(json) {
        var _a, _b, _c;
        let data = json.data;
        this.id = parseInt(data.id);
        this.name = (_a = data === null || data === void 0 ? void 0 : data.attributes) === null || _a === void 0 ? void 0 : _a["user-name"];
        this.ELO = (_b = data === null || data === void 0 ? void 0 : data.attributes) === null || _b === void 0 ? void 0 : _b.elo;
        this.rank = (_c = data === null || data === void 0 ? void 0 : data.attributes) === null || _c === void 0 ? void 0 : _c.rank;
        this.changed = true;
    }
    fillName(json) {
        var _a, _b, _c;
        let data = json.data;
        this.id = parseInt(data.id);
        this.name = (_a = data === null || data === void 0 ? void 0 : data.attributes) === null || _a === void 0 ? void 0 : _a["user-name"];
        this.ELO = (_b = data === null || data === void 0 ? void 0 : data.attributes) === null || _b === void 0 ? void 0 : _b.elo;
        this.rank = (_c = data === null || data === void 0 ? void 0 : data.attributes) === null || _c === void 0 ? void 0 : _c.rank;
        this.changed = true;
    }
}
let players = [];
const playerIds_tracked = [
    4008, 42092, 45899, 186338, 74829, 144393, 487596, 488310, 586869, 366274,
    378113, 426378, 484129, 486906, 494352, 498963, 504586, 504610, 558168,
    583429, 490463, 518674, 379428, 485512, 487820, 487629, 492317, 113125,
    596993, 500126, 487314,
];
function updateInfo(info) {
    let element = document.getElementById("info");
    element.innerHTML = info.toString();
}
function init() {
    players = [];
    updateInfo("");
    for (let playerId of playerIds_tracked) {
        let player = new Player({ data: { id: playerId.toString() } });
        players.push(player);
    }
}
function loadPlayersData() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Fetching these users:");
        let promises = [];
        for (const id_tracked of playerIds_tracked) {
            promises.push(fetch(`https://www.elevenvr.club/accounts/${id_tracked.toString()}`));
        }
        let online_promise = fetch("https://api.codetabs.com/v1/proxy/?quest=http://elevenlogcollector-env.js6z6tixhb.us-west-2.elasticbeanstalk.com/ElevenServerLiteSnapshot");
        for (const promise of promises) {
            try {
                let response = yield promise;
                let json = yield response.json();
                let player = players.filter((player) => player.id.toString() === json.data.id)[0];
                player.fillName(json);
                console.log(`Received ${player.name} account info`);
            }
            catch (err) {
                console.error(err);
                updateInfo(`Error: Failed to fetch player info. ${err}`);
            }
        }
        players.sort((a, b) => a.name.localeCompare(b.name.toString(), "en", { sensitivity: "base" }));
        try {
            let online_response = yield online_promise;
            let json = yield online_response.json();
            console.log(`Received online info`);
            for (const player of players) {
                let users = json.OnlineUses.filter((onlinePlayer) => onlinePlayer.Id === player.id.toString());
                if (users.length > 0) {
                    player.online = true;
                    player.device = users[0].Device;
                }
            }
            players.forEach((player) => {
                let usersInRoom = json.UsersInRooms.filter((userInRoom) => userInRoom.Id === player.id.toString());
                console.log(`User ${player.name} is ${usersInRoom.length == 0 ? "NOT" : ""} in room`);
                let rooms = json.Rooms.filter((room) => {
                    let roomplayers = room.Players;
                    for (let i = 0; i < roomplayers.length; i++) {
                        if (roomplayers[i].Id === player.id.toString()) {
                            return true;
                        }
                    }
                    return false;
                });
                if (rooms.length > 0) {
                    let room = rooms[0];
                    room.Players.forEach((roomplayers) => {
                        if (roomplayers.Id !== player.id.toString()) {
                            player.opponent = roomplayers.UserName;
                            player.opponentELO = roomplayers.ELO;
                            player.opponentid = roomplayers.Id;
                        }
                    });
                }
            });
        }
        catch (err) {
            console.error(err);
            updateInfo(`Error: Failed to fetch live snapshot. ${err}`);
        }
    });
}
function renderPlayersData() {
    let shouldCreateRows = false;
    let table = document.getElementById("players");
    if (table.rows.length == 1) {
        shouldCreateRows = true;
    }
    for (let playerId = 0; playerId < players.length; playerId++) {
        let player = players[playerId];
        let table = document.getElementById("players");
        let row;
        if (shouldCreateRows) {
            row = table.insertRow(-1);
            for (let cellId = 0; cellId < cellsTemplate.length; cellId++) {
                row.insertCell();
            }
        }
        else
            row = table.rows[playerId + 1];
        row.cells[0].innerHTML = `<a href="https://beta.11-stats.com/stats/${player.id}/statistics" target="_blank">📈</a>`;
        row.cells[1].innerHTML = `<a href="https://www.elevenvr.net/eleven/${player.id}" target="_blank">${player.id}</a>`;
        row.cells[2].innerHTML = `${player.name}${player.id === 500126 ? "（教官)" : ""}`;
        row.cells[3].innerHTML = `${player.ELO}${player.rank <= 1000 ? " (#" + player.rank.toString() + ")" : ""}`;
        row.cells[4].innerHTML = `${player.online ? "✔️(" + player.device + ")" : "❌"}`;
        let opponent_str = "";
        if (player.opponent !== undefined) {
            opponent_str = `<a href="https://www.elevenvr.net/eleven/${player.id}" target='_blank'>${player.opponent}</a> (${player.opponentELO}) <a href="https://www.elevenvr.net/matchup/${player.id}/${player.opponentid}" target='_blank'>⚔️</a></th></tr>`;
        }
        row.cells[5].innerHTML = `${opponent_str}`;
        player.changed = false;
    }
}
function preLoading() {
    updateInfo(`Loading...`);
}
function postLoading() {
    updateInfo(`Done`);
}
function loadAndRender() {
    return __awaiter(this, void 0, void 0, function* () {
        preLoading();
        yield loadPlayersData();
        renderPlayersData();
        postLoading();
    });
}
const refreshInterval = 60;
let seconds = refreshInterval;
function updateTimerInfo() {
    updateInfo(`Updating in ${seconds} seconds`);
    if (seconds == 1) {
        seconds = refreshInterval;
    }
    else {
        seconds -= 1;
    }
}
function main() {
    loadAndRender();
    setInterval(loadAndRender, refreshInterval * 1000);
    setInterval(updateTimerInfo, 1000);
}
init();
main();
//# sourceMappingURL=index.js.map