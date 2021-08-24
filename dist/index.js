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
const DEBUG = false;
const cellsTemplate = [
    "links",
    "id",
    "name",
    "elo",
    "opponent",
    "last online",
    "online",
];
class Player {
    constructor(json) {
        var _a, _b, _c;
        let data = json.data;
        this.id = parseInt(data.id);
        this.name = (_a = data === null || data === void 0 ? void 0 : data.attributes) === null || _a === void 0 ? void 0 : _a["user-name"];
        this.ELO = (_b = data === null || data === void 0 ? void 0 : data.attributes) === null || _b === void 0 ? void 0 : _b.elo;
        this.rank = (_c = data === null || data === void 0 ? void 0 : data.attributes) === null || _c === void 0 ? void 0 : _c.rank;
        this.lastOnline = 0;
    }
    fillName(json) {
        var _a, _b, _c, _d;
        let data = json.data;
        this.id = parseInt(data.id);
        this.name = (_a = data === null || data === void 0 ? void 0 : data.attributes) === null || _a === void 0 ? void 0 : _a["user-name"];
        this.ELO = (_b = data === null || data === void 0 ? void 0 : data.attributes) === null || _b === void 0 ? void 0 : _b.elo;
        this.rank = (_c = data === null || data === void 0 ? void 0 : data.attributes) === null || _c === void 0 ? void 0 : _c.rank;
        this.lastOnline = Date.parse((_d = data === null || data === void 0 ? void 0 : data.attributes) === null || _d === void 0 ? void 0 : _d["last-online"]);
    }
    fillOnlineInfo(json) {
        var _a;
        let users = json.OnlineUses.filter((onlinePlayer) => onlinePlayer.Id === this.id.toString());
        if (users.length > 0) {
            this.online = true;
            this.device = users[0].Device;
        }
        else {
            this.online = false;
            this.device = undefined;
        }
        let usersInRoom = json.UsersInRooms.filter((userInRoom) => userInRoom.Id === this.id.toString());
        console.log(`User ${this.name} is ${usersInRoom.length == 0 ? "NOT" : ""} in room`);
        let rooms = json.Rooms.filter((room) => {
            let roomplayers = room.Players;
            for (let i = 0; i < roomplayers.length; i++) {
                if (roomplayers[i].Id === this.id.toString()) {
                    return true;
                }
            }
            return false;
        });
        if (rooms.length > 0) {
            let room = rooms[0];
            room.Players.forEach((roomplayer) => {
                if (roomplayer.Id !== this.id.toString()) {
                    this.opponent = roomplayer.UserName;
                    this.opponentELO = roomplayer.ELO;
                    this.opponentid = roomplayer.Id;
                }
            });
            this.ranked = (_a = room === null || room === void 0 ? void 0 : room.Match) === null || _a === void 0 ? void 0 : _a.Ranked;
        }
        else {
            this.opponent = undefined;
            this.opponentELO = undefined;
            this.opponentid = undefined;
            this.ranked = undefined;
        }
    }
}
let players = [];
let playerIds_tracked = [];
function updateInfo(info) {
    let element = document.getElementById("info");
    element.innerHTML = info.toString();
}
function loadPlayerList() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (DEBUG) {
                playerIds_tracked = [
                    4001, 4002, 4003, 4007, 4006, 4005, 4010, 4008, 4009,
                ];
            }
            else {
                let response = yield fetch("./players.json");
                let json = yield response.json();
                playerIds_tracked.push(...json.playerIds);
            }
        }
        catch (err) {
            console.error(err);
            updateInfo(`Error: Failed to fetch player list. ${err}`);
        }
    });
}
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadPlayerList();
        players = [];
        updateInfo("");
        for (let playerId of playerIds_tracked) {
            let player = new Player({ data: { id: playerId.toString() } });
            players.push(player);
        }
    });
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
        try {
            let online_response = yield online_promise;
            let json = yield online_response.json();
            for (const player of players) {
                player.fillOnlineInfo(json);
            }
            console.log(`Received online info`);
        }
        catch (err) {
            console.error(err);
            updateInfo(`Error: Failed to fetch live snapshot. ${err}`);
        }
    });
}
function renderPlayersData(playersOld, players) {
    let shouldCreateRows = false;
    let table = document.getElementById("players");
    let tbody = table.tBodies[0];
    if (tbody.rows.length == 0) {
        shouldCreateRows = true;
    }
    for (let playerId = 0; playerId < players.length; playerId++) {
        let playerOld = playersOld[playerId];
        let player = players[playerId];
        let changed = false;
        let stringOld = JSON.stringify(playerOld);
        let stringNew = JSON.stringify(player);
        if (stringOld.localeCompare(stringNew) === 0)
            changed = false;
        else
            changed = true;
        console.log(`player ${player.name} has ${changed ? "" : "NOT "}changed!`);
        console.log(`old: ${stringOld}`);
        console.log(`new: ${stringNew}`);
        $(`#players tbody tr:nth-child(${playerId + 1})`).removeClass("online");
        let row;
        if (shouldCreateRows) {
            row = tbody.insertRow(-1);
            for (let cellId = 0; cellId < cellsTemplate.length; cellId++) {
                row.insertCell();
            }
            row.cells[6].classList.add("hidden");
        }
        else
            row = tbody.rows[playerId];
        if (changed == true && shouldCreateRows === false) {
            $(`#players tbody tr:nth-child(${playerId + 1})`)
                .fadeOut(500)
                .fadeIn(500)
                .fadeOut(500)
                .fadeIn(500);
        }
        if (player.online) {
            $(`#players tbody tr:nth-child(${playerId + 1})`).addClass("online");
        }
        row.cells[0].innerHTML = `<a href="https://beta.11-stats.com/stats/${player.id}/statistics" target="_blank">📈</a>`;
        row.cells[1].innerHTML = `<a href="https://www.elevenvr.net/eleven/${player.id}" target="_blank">${player.id}</a>`;
        row.cells[2].innerHTML =
            player.name === undefined ? "⌛" : `${player.name}`;
        row.cells[3].innerHTML =
            player.ELO === undefined
                ? "⌛"
                : `${player.ELO}${player.rank <= 1000 ? " (#" + player.rank.toString() + ")" : ""}`;
        let opponent_str = "";
        if (player.opponent !== undefined) {
            opponent_str = `<a href="https://www.elevenvr.net/eleven/${player.opponentid}" target='_blank'>${player.opponent}</a> <span class="${player.ranked ? "ranked" : "unranked"}">(${player.opponentELO})<span><a href="https://www.elevenvr.net/matchup/${player.id}/${player.opponentid}" target='_blank'>⚔️</a></th></tr>`;
        }
        row.cells[4].innerHTML =
            player.opponent === undefined ? "" : `${opponent_str}`;
        function getTimeDifferenceString(current, previous) {
            var msPerMinute = 60 * 1000;
            var msPerHour = msPerMinute * 60;
            var msPerDay = msPerHour * 24;
            var msPerMonth = msPerDay * 30;
            var msPerYear = msPerDay * 365;
            var elapsed = current - previous;
            if (elapsed < msPerMinute) {
                return Math.round(elapsed / 1000) + " seconds ago";
            }
            else if (elapsed < msPerHour) {
                return Math.round(elapsed / msPerMinute) + " minutes ago";
            }
            else if (elapsed < msPerDay) {
                return Math.round(elapsed / msPerHour) + " hours ago";
            }
            else if (elapsed < msPerMonth) {
                return "approximately " + Math.round(elapsed / msPerDay) + " days ago";
            }
            else if (elapsed < msPerYear) {
                return ("approximately " + Math.round(elapsed / msPerMonth) + " months ago");
            }
            else {
                return ("approximately " + Math.round(elapsed / msPerYear) + " years ago");
            }
        }
        var options = {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timeZoneName: "short",
        };
        row.cells[5].innerHTML =
            player.online === undefined
                ? "⌛"
                : `${player.online === true
                    ? player.device
                    : "<span class='hidden'>" +
                        player.lastOnline +
                        "###</span><span title='" +
                        getTimeDifferenceString(Date.now(), player.lastOnline) +
                        "'>" +
                        new Date(player.lastOnline).toLocaleString(undefined, options) +
                        "</span>"}`;
        row.cells[5].setAttribute("data-timestamp", player.lastOnline.toString());
        row.cells[6].innerHTML =
            player.online === undefined
                ? "⌛"
                : `${player.online === true ? "✔️" : "❌"}`;
    }
    $("#players").trigger("update");
    $("#players").trigger("appendCache");
}
function preLoading() {
    updateInfo(`Loading...`);
}
function postLoading() {
    updateInfo(`Loaded. Rendering...`);
}
function loadAndRender() {
    return __awaiter(this, void 0, void 0, function* () {
        preLoading();
        let playersOld = [];
        for (let player of players) {
            playersOld.push(Object.assign({}, player));
        }
        yield loadPlayersData();
        postLoading();
        renderPlayersData(playersOld, players);
    });
}
const refreshInterval = DEBUG ? 10 : 60;
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
    return __awaiter(this, void 0, void 0, function* () {
        $.tablesorter.addParser({
            id: "rangesort",
            is: function (_) {
                return false;
            },
            format: function (s, _table) {
                return s.split("###")[0];
            },
            type: "numeric",
            parsed: false,
        });
        $("#players").tablesorter({
            sortInitialOrder: "desc",
            sortList: [
                [6, 0],
                [2, 0],
            ],
            headers: {
                0: { sorter: false, parser: false },
                1: { sorter: "digit", sortInitialOrder: "asc" },
                2: { sorter: "string", sortInitialOrder: "asc" },
                3: { sorter: "string", sortInitialOrder: "desc" },
                4: { sorter: false, parser: false },
                5: { sorter: "rangesort" },
            },
        });
        yield loadAndRender();
        setInterval(loadAndRender, refreshInterval * 1000);
        setInterval(updateTimerInfo, 1000);
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield init();
    yield main();
}))();
//# sourceMappingURL=index.js.map