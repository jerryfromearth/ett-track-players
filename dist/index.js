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
    "rank",
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
            this.name = users[0].UserName;
            this.ELO = Math.floor(users[0].ELO);
        }
        else {
            this.online = false;
            this.device = undefined;
        }
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
const maxPlayers = 500;
function updateCountdown(countdown) {
    let element = document.getElementById("countdown");
    element.innerHTML = countdown.toString();
}
function updateInfo(info) {
    let element = document.getElementById("info");
    element.innerHTML = info.toString();
}
let playerIds_tracked = [];
function loadPlayerList() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        players = [];
        playerIds_tracked = [];
        try {
            if (DEBUG) {
                playerIds_tracked = [648979, 143648, 104494, 632891, 42092];
            }
            else {
                const urlParams = new URLSearchParams(window.location.search);
                let ids = (_a = urlParams
                    .get("ids")) === null || _a === void 0 ? void 0 : _a.split(",").map((id) => +id).filter((id) => !Number.isNaN(id));
                ids = [...new Set(ids)];
                if (ids && ids.length > 0) {
                    playerIds_tracked.push(...ids);
                }
                else {
                    let response = yield fetch("./players.json");
                    let json = yield response.json();
                    playerIds_tracked.push(...json.playerIds);
                }
            }
        }
        catch (err) {
            console.error(err);
            updateCountdown(`Error: Failed to fetch player list. Please either use "?ids=" parameter, or place a file called "players.json" in the source folder.\n${err}`);
            throw err;
        }
        playerIds_tracked = [...new Set(playerIds_tracked)];
        for (let playerId of playerIds_tracked) {
            if (players.length < maxPlayers) {
                let player = new Player({ data: { id: playerId.toString() } });
                players.push(player);
            }
            else {
                console.warn(`Players limit reached! Won't add ${playerId} to the list`);
            }
        }
    });
}
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadPlayerList();
        updateCountdown("");
        renderPlayersData(players);
    });
}
function sortPlayersTable() {
    $("#players").trigger("appendCache");
    $("#players").trigger("update");
}
function markCertainPlayers() {
    const rankColors = ["gold", "silver", "bronze"];
    for (const color of rankColors) {
        $(`#players tr`).removeClass(color);
    }
    const playersSorted = [...players].sort((player1, player2) => player2.ELO - player1.ELO);
    for (let rank = 0; rank < playersSorted.length; rank++) {
        let player = playersSorted[rank];
        if (rank < rankColors.length) {
            $(`#players tr#player-${player.id.toString()}`).addClass(rankColors[rank]);
        }
        $(`#players tr#player-${player.id.toString()} td.rank`).html((rank + 1).toString());
    }
}
let firstTime = false;
function loadPlayersData() {
    return __awaiter(this, void 0, void 0, function* () {
        let online_promise = new Promise(() => { });
        if (window.location.protocol === "https:") {
            online_promise = fetch("https://api.codetabs.com/v1/proxy/?quest=http://elevenlogcollector-env.js6z6tixhb.us-west-2.elasticbeanstalk.com/ElevenServerLiteSnapshot");
        }
        else if (window.location.protocol === "http:") {
            online_promise = fetch("http://elevenlogcollector-env.js6z6tixhb.us-west-2.elasticbeanstalk.com/ElevenServerLiteSnapshot");
        }
        else {
            console.error(`Unsupported protocol: ${window.location.protocol}`);
        }
        let delay = (min, max) => {
            return new Promise((resolve) => {
                setTimeout(resolve, Math.random() * (max - min) + min);
            });
        };
        let promises = [];
        if (firstTime == false) {
            for (const [i, id] of players.map((player) => player.id).entries()) {
                promises.push(delay(i * 100, i * 100).then(() => {
                    return fetch(`https://api3.elevenvr.com/accounts/${id.toString()}?api-key=gyghufjiuhrgy783ru293ihur8gy`);
                }));
            }
            firstTime = true;
        }
        try {
            online_promise
                .then((online_response) => {
                return online_response.json();
            })
                .then((json) => {
                let playerIdsAsStrings = players.map((player) => player.id.toString());
                json.OnlineUses = json.OnlineUses.filter((OnlineUse) => {
                    return playerIdsAsStrings.includes(OnlineUse.Id);
                });
                json.UsersInRooms = json.UsersInRooms.filter((UserInRoom) => {
                    return playerIdsAsStrings.includes(UserInRoom.Id);
                });
                json.Rooms = json.Rooms.filter((Room) => {
                    for (const playerIdAsString of playerIdsAsStrings) {
                        if (Room.Players.map((RoomPlayer) => RoomPlayer.Id).includes(playerIdAsString)) {
                            return true;
                        }
                    }
                    return false;
                });
                for (let id = 0; id < players.length; id++) {
                    players[id].fillOnlineInfo(json);
                    renderPlayerData(players[id]);
                }
                sortPlayersTable();
            });
        }
        catch (err) {
            console.error(err);
            updateCountdown(`Error: Failed to fetch live snapshot. ${err}`);
        }
        yield Promise.allSettled(promises.map((promise) => __awaiter(this, void 0, void 0, function* () {
            try {
                let response = yield promise;
                let json = yield response.json();
                let player = players.filter((player) => player.id.toString() === json.data.id)[0];
                player.fillName(json);
                renderPlayerData(player);
            }
            catch (err) {
                console.error(err);
                updateCountdown(`Error: Failed to fetch player info. ${err}`);
            }
        })));
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const sixMonthsAgoTimestamp = sixMonthsAgo.getTime();
        const inactivePlayerIds = players
            .filter((player) => player.lastOnline && player.lastOnline < sixMonthsAgoTimestamp)
            .map((player) => player.id);
        console.log("Player IDs last online more than 6 months ago:", inactivePlayerIds);
        const activeTrackedPlayerIds = playerIds_tracked.filter((id) => !inactivePlayerIds.includes(id));
        console.log("Tracked Player IDs active within the last 6 months:", activeTrackedPlayerIds);
        markCertainPlayers();
        sortPlayersTable();
    });
}
function renderPlayerData(player) {
    let table = document.getElementById("players");
    let tbody = table.tBodies[0];
    let playerRowId = [...tbody.rows].findIndex((row) => row.getAttribute("id") === `player-${player.id.toString()}`);
    let row = tbody.rows[playerRowId];
    $(`tr#player-${player.id.toString()}`).removeClass("online");
    if (player.online) {
        $(`tr#player-${player.id.toString()}`).addClass("online");
    }
    $(document).on("click", `tr#player-${player.id.toString()} .matchupButton`, function () {
        $(`tr#player-${player.id.toString()}`).addClass("online");
    });
    row.cells[0].innerHTML = `<a title="11ClubHouse" href="https://11clubhouse.com/${player.id}/" target="_blank">🏓</a><a style="display:none" class="matchupButton" href="#">⚔️</a><span class="matchupResult">&nbsp;</span>`;
    row.cells[1].classList.add("rank");
    row.cells[2].innerHTML = `<a href="https://www.elevenvr.net/eleven/${player.id}" target="_blank">${player.id}</a>`;
    row.cells[2].classList.add("id");
    row.cells[3].innerHTML =
        player.name === undefined
            ? "⌛"
            : `<a title="ETT website" href="https://www.elevenvr.net/eleven/${player.id}" target="_blank">${player.name}</a>`;
    row.cells[4].innerHTML =
        player.ELO === undefined
            ? "⌛"
            : `${player.ELO}${player.rank <= 1000 && player.rank > 0
                ? " (#" + player.rank.toString() + ")"
                : ""}`;
    let opponent_str = "";
    if (player.opponent !== undefined) {
        opponent_str = `<a href="https://www.elevenvr.net/eleven/${player.opponentid}" target='_blank'>${player.opponent}</a> <span class="${player.ranked ? "ranked" : "unranked"}">(${player.opponentELO})<span><a title="matchup" href="https://www.elevenvr.net/matchup/${player.id}/${player.opponentid}" target='_blank'>⚔️</a>`;
    }
    opponent_str += `<a title="scoreboard" class="scoreboard" href="https://cristy94.github.io/eleven-vr-scoreboard/?user=${player.id}&rowsReversed=0&home-offset=0&away-offset=0" target='_blank'>🔍</a>`;
    row.cells[5].innerHTML = opponent_str;
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
            return "approximately " + Math.round(elapsed / msPerYear) + " years ago";
        }
    }
    var options = {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timeZoneName: "short",
    };
    row.cells[6].innerHTML =
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
    row.cells[6].setAttribute("data-timestamp", player.lastOnline.toString());
    row.cells[6].classList.add("last-online");
    row.cells[7].innerHTML =
        player.online === undefined
            ? "⌛"
            : `${player.online === true ? "✔️" : "❌"}`;
}
function renderPlayersData(players) {
    let shouldCreateRows = false;
    let table = document.getElementById("players");
    let tbody = table.tBodies[0];
    if (tbody.rows.length == 0) {
        shouldCreateRows = true;
    }
    let row;
    if (shouldCreateRows) {
        for (let player of players) {
            row = tbody.insertRow(-1);
            for (let cellId = 0; cellId < cellsTemplate.length; cellId++) {
                row.insertCell();
                row.setAttribute("id", `player-${player.id.toString()}`);
            }
            row.cells[7].classList.add("hidden");
        }
    }
    for (let playerId = 0; playerId < players.length; playerId++) {
        let player = players[playerId];
        renderPlayerData(player);
    }
}
function preLoading() {
    updateCountdown(`Loading...`);
}
function postLoading() {
    updateCountdown(`Loaded.`);
    updateInfo(`Total Players: ${players.length} ${players.length == maxPlayers ? "(Limit reached)" : ""}`);
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
    });
}
const refreshInterval = DEBUG ? 10 : 60;
let seconds = refreshInterval;
function countdownTimerCallback() {
    updateCountdown(`Updating in ${seconds} seconds`);
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
                [7, 0],
                [1, 0],
                [4, 1],
            ],
            headers: {
                0: { sorter: false, parser: false },
                1: { sorter: "digit", sortInitialOrder: "desc" },
                2: { sorter: "digit", sortInitialOrder: "asc" },
                3: { sorter: "string", sortInitialOrder: "asc" },
                4: { sorter: "string", sortInitialOrder: "desc" },
                5: { sorter: false, parser: false },
                6: { sorter: "rangesort" },
            },
        });
        yield loadAndRender();
        setInterval(loadAndRender, refreshInterval * 1000);
        setInterval(countdownTimerCallback, 1000);
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield init();
    yield main();
}))();
//# sourceMappingURL=index.js.map