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
class Player {
    constructor(json) {
        let data = json.data;
        this.id = data.id;
        this.name = data.attributes["user-name"];
        this.ELO = data.attributes.elo;
        this.rank = data.attributes.rank;
        this.online = false;
    }
}
const playerIds_tracked = [
    4008, 42092, 45899, 186338, 74829, 144393, 487596, 488310, 586869, 366274,
    378113, 426378, 484129, 486906, 494352, 498963, 504586, 504610, 558168,
    583429, 490463, 518674, 379428, 485512, 487820, 487629, 492317, 113125,
    596993,
];
function init() {
    players = [];
    let element = document.getElementById("app");
    element.innerHTML = "";
    let table = document.getElementById("players");
    let rows = table.rows;
    while (rows.length > 1)
        table.deleteRow(1);
}
let players = [];
function fetch_players() {
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
                let player = new Player(json);
                players.push(player);
                console.log(player.name);
            }
            catch (err) {
                console.error(err);
            }
        }
        players.sort((a, b) => a.name.localeCompare(b.name.toString(), "en", { sensitivity: "base" }));
        try {
            let online_response = yield online_promise;
            let json = yield online_response.json();
            for (const player of players) {
                let users = json.OnlineUses.filter((onlinePlayer) => onlinePlayer.Id === player.id.toString());
                if (users.length > 0) {
                    player.online = true;
                    player.device = users[0].Device;
                }
            }
            players.forEach((player) => {
                let usersInRoom = json.UsersInRooms.filter((userInRoom) => userInRoom.Id === player.id.toString());
                console.log(`User ${player.name} is ${usersInRoom.length == 0 ? "NOT" : ""}in room`);
                console.log("Room:");
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
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        init();
        yield fetch_players();
        for (const player of players) {
            console.log(JSON.stringify(player, null, 2));
            let table = document.getElementById("players");
            let row = table.insertRow(-1);
            row.insertCell().innerHTML = `<a href="https://beta.11-stats.com/stats/${player.id}/statistics" target="_blank">📈</a>`;
            row.insertCell().innerHTML = `<a href="https://www.elevenvr.net/eleven/${player.id}" target="_blank">${player.id}</a>`;
            row.insertCell().innerHTML = `${player.name}`;
            row.insertCell().innerHTML = `${player.ELO}${player.rank <= 1000 ? " (#" + player.rank.toString() + ")" : ""}`;
            row.insertCell().innerHTML = `${player.online ? "✔️(" + player.device + ")" : "❌"}`;
            let opponent_str = "";
            if (player.opponent !== undefined) {
                opponent_str = `<a href="https://www.elevenvr.net/eleven/${player.id}" target='_blank'>${player.opponent}</a> (${player.opponentELO}) <a href="https://www.elevenvr.net/matchup/${player.id}/${player.opponentid}" target='_blank'>⚔️</a></th></tr>`;
            }
            row.insertCell().innerHTML = `${opponent_str}`;
        }
    });
}
const refreshInterval = 60;
let seconds = refreshInterval;
function updateTimer() {
    console.log("time");
    let element = document.getElementById("counter");
    element.innerText = seconds.toString();
    if (seconds == 1) {
        seconds = refreshInterval;
    }
    else {
        seconds -= 1;
    }
}
init();
main();
setInterval(main, refreshInterval * 1000);
setInterval(updateTimer, 1000);
//# sourceMappingURL=index.js.map