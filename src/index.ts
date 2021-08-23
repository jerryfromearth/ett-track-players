const DEBUG = false;

const cellsTemplate = ["links", "id", "name", "elo", "opponent", "online"];
class Player {
  id: Number;
  name: String;
  ELO: Number;
  rank: Number;
  online?: Boolean;
  device?: String;
  ranked?: Boolean;
  opponent?: String;
  opponentid?: Number;
  opponentELO?: Number;

  constructor(json: any) {
    let data = json.data;

    this.id = parseInt(data.id);
    this.name = data?.attributes?.["user-name"];
    this.ELO = data?.attributes?.elo;
    this.rank = data?.attributes?.rank;
  }

  fillName(json: any) {
    let data = json.data;

    this.id = parseInt(data.id);
    this.name = data?.attributes?.["user-name"];
    this.ELO = data?.attributes?.elo;
    this.rank = data?.attributes?.rank;
  }

  fillOnlineInfo(json: any) {
    let users = json.OnlineUses.filter(
      (onlinePlayer: any) => onlinePlayer.Id === this.id.toString()
    );
    if (users.length > 0) {
      this.online = true;
      this.device = users[0].Device;
    } else {
      this.online = false;
      this.device = undefined;
    }

    // Find out opponent
    let usersInRoom = json.UsersInRooms.filter(
      (userInRoom: any) => userInRoom.Id === this.id.toString()
    );
    console.log(
      `User ${this.name} is ${usersInRoom.length == 0 ? "NOT" : ""} in room`
    );

    let rooms = json.Rooms.filter((room: any) => {
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
      room.Players.forEach((roomplayer: any) => {
        if (roomplayer.Id !== this.id.toString()) {
          this.opponent = roomplayer.UserName;
          this.opponentELO = roomplayer.ELO;
          this.opponentid = roomplayer.Id;
        }
      });
      this.ranked = room?.Match?.Ranked;
    } else {
      this.opponent = undefined;
      this.opponentELO = undefined;
      this.opponentid = undefined;
      this.ranked = undefined;
    }
  }
}

let players: Player[] = [];

let playerIds_tracked: Number[] = [];

function updateInfo(info: String) {
  let element = document.getElementById("info")! as HTMLDivElement;
  element.innerHTML = info.toString();
}

async function loadPlayerList() {
  try {
    if (DEBUG) {
      playerIds_tracked = [4008];
    } else {
      let response = await fetch("./players.json");
      let json = await response.json();
      playerIds_tracked.push(...json.playerIds);
    }
  } catch (err) {
    console.error(err);
    updateInfo(`Error: Failed to fetch player list. ${err}`);
  }
}
async function init() {
  await loadPlayerList();

  players = [];
  updateInfo("");

  for (let playerId of playerIds_tracked) {
    let player = new Player({ data: { id: playerId.toString() } });
    players.push(player);
  }
}

async function loadPlayersData() {
  console.log("Fetching these users:");
  let promises: Promise<Response>[] = [];
  for (const id_tracked of playerIds_tracked) {
    promises.push(
      fetch(`https://www.elevenvr.club/accounts/${id_tracked.toString()}`)
    );
  }

  let online_promise = fetch(
    "https://api.codetabs.com/v1/proxy/?quest=http://elevenlogcollector-env.js6z6tixhb.us-west-2.elasticbeanstalk.com/ElevenServerLiteSnapshot"
  );

  for (const promise of promises) {
    try {
      let response = await promise;
      let json = await response.json();
      let player = players.filter(
        (player) => player.id.toString() === json.data.id
      )[0];
      player.fillName(json);
      console.log(`Received ${player.name} account info`);
    } catch (err) {
      console.error(err);
      updateInfo(`Error: Failed to fetch player info. ${err}`);
    }
  }

  // Fill in online status
  try {
    let online_response = await online_promise;
    let json = await online_response.json();

    for (const player of players) {
      player.fillOnlineInfo(json);
    }
    console.log(`Received online info`);
  } catch (err) {
    console.error(err);
    updateInfo(`Error: Failed to fetch live snapshot. ${err}`);
  }

  // sort players
  players.sort((a: Player, b: Player) => {
    let diff = +(b.online === true) - +(a.online === true);
    if (diff === 0) {
      return a.name.localeCompare(b.name.toString(), "en", {
        sensitivity: "base",
      });
    } else return diff;
  });
}

function renderPlayersData(playersOld: Player[], players: Player[]) {
  // re-render players
  let shouldCreateRows = false;
  let table = document.getElementById("players") as HTMLTableElement;
  if (table.rows.length == 1) {
    shouldCreateRows = true;
  }

  for (let playerId = 0; playerId < players.length; playerId++) {
    let playerOld = playersOld[playerId];
    let player = players[playerId];
    let changed = false; // Whether playerOld and player are different
    //console.log(JSON.stringify(player, null, 2));

    // Determine "changed"
    let stringOld = JSON.stringify(playerOld);
    let stringNew = JSON.stringify(player);
    if (stringOld.localeCompare(stringNew) === 0) changed = false;
    else changed = true;
    console.log(`player ${player.name} has ${changed ? "" : "NOT "}changed!`);
    console.log(`old: ${stringOld}`);
    console.log(`new: ${stringNew}`);

    // // Remove class set from the previous iteration
    $(`#players tbody tr:nth-child(${playerId + 2})`).removeClass("online");

    let table = document.getElementById("players") as HTMLTableElement;
    let row: HTMLTableRowElement;
    if (shouldCreateRows) {
      row = table.insertRow(-1);
      for (let cellId = 0; cellId < cellsTemplate.length; cellId++) {
        row.insertCell();
      }
    } else row = table.rows[playerId + 1]; // first row is header

    if (changed == true && shouldCreateRows === false) {
      // $(`#players tbody tr:nth-child(${playerId + 2})`).addClass("loading");
      $(`#players tbody tr:nth-child(${playerId + 2})`)
        .fadeOut(500)
        .fadeIn(500)
        .fadeOut(500)
        .fadeIn(500);
    }

    if (player.online) {
      $(`#players tbody tr:nth-child(${playerId + 2})`).addClass("online");
    }

    row.cells[0].innerHTML = `<a href="https://beta.11-stats.com/stats/${player.id}/statistics" target="_blank">📈</a>`;
    row.cells[1].innerHTML = `<a href="https://www.elevenvr.net/eleven/${player.id}" target="_blank">${player.id}</a>`;
    row.cells[2].innerHTML =
      player.name === undefined ? "⌛" : `${player.name}`;
    row.cells[3].innerHTML =
      player.ELO === undefined
        ? "⌛"
        : `${player.ELO}${
            player.rank <= 1000 ? " (#" + player.rank.toString() + ")" : ""
          }`;

    let opponent_str = "";
    if (player.opponent !== undefined) {
      opponent_str = `<a href="https://www.elevenvr.net/eleven/${
        player.opponentid
      }" target='_blank'>${player.opponent}</a> <span class="${
        player.ranked ? "ranked" : "unranked"
      }">(${
        player.opponentELO
      })<span><a href="https://www.elevenvr.net/matchup/${player.id}/${
        player.opponentid
      }" target='_blank'>⚔️</a></th></tr>`;
    }
    row.cells[4].innerHTML =
      player.opponent === undefined ? "" : `${opponent_str}`;

    row.cells[5].innerHTML =
      player.online === undefined
        ? "⌛"
        : `${player.online === true ? "✔️(" + player.device + ")" : "❌"}`;
  }
}

function preLoading() {
  updateInfo(`Loading...`);
}

function postLoading() {
  updateInfo(`Loaded. Rendering...`);
}
async function loadAndRender() {
  preLoading();

  let playersOld: Player[] = [];
  for (let player of players) {
    playersOld.push(Object.assign({}, player));
  }
  await loadPlayersData();
  postLoading();

  renderPlayersData(playersOld, players);
}

const refreshInterval = DEBUG ? 10 : 60; // seconds
let seconds = refreshInterval;

function updateTimerInfo() {
  updateInfo(`Updating in ${seconds} seconds`);
  if (seconds == 1) {
    seconds = refreshInterval;
  } else {
    seconds -= 1;
  }
}

async function main() {
  await loadAndRender();

  setInterval(loadAndRender, refreshInterval * 1000);

  setInterval(updateTimerInfo, 1000);
}
(async () => {
  await init();
  await main();
})();
