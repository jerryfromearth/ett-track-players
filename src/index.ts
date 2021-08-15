//import fetch from "node-fetch"; // only for local nodejs

//import $ from "jquery";

const cellsTemplate = ["links", "id", "name", "elo", "online", "opponent"];
class Player {
  id: Number;
  name: String;
  ELO: Number;
  rank: Number;
  online?: Boolean;
  device?: String;
  opponent?: String;
  opponentid?: Number;
  opponentELO?: Number;
  changed?: boolean;

  constructor(json: any) {
    let data = json.data;

    this.id = parseInt(data.id);
    this.name = data?.attributes?.["user-name"];
    this.ELO = data?.attributes?.elo;
    this.rank = data?.attributes?.rank;
    this.changed = true;
  }

  fillName(json: any) {
    let data = json.data;
    this.id = parseInt(data.id);
    this.name = data?.attributes?.["user-name"];
    this.ELO = data?.attributes?.elo;
    this.rank = data?.attributes?.rank;
    this.changed = true;
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
      room.Players.forEach((roomplayers: any) => {
        if (roomplayers.Id !== this.id.toString()) {
          this.opponent = roomplayers.UserName;
          this.opponentELO = roomplayers.ELO;
          this.opponentid = roomplayers.Id;
        }
      });
    } else {
      this.opponent = undefined;
      this.opponentELO = undefined;
      this.opponentid = undefined;
    }
  }
}

let players: Player[] = [];

const playerIds_tracked = [
  4008, 42092, 45899, 186338, 74829, 144393, 487596, 488310, 586869, 366274,
  378113, 426378, 484129, 486906, 494352, 498963, 504586, 504610, 558168,
  583429, 490463, 518674, 379428, 485512, 487820, 487629, 492317, 113125,
  596993, 500126, 487314,
];

function updateInfo(info: String) {
  let element = document.getElementById("info")! as HTMLDivElement;
  element.innerHTML = info.toString();
}
//
function init() {
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

  // sort players
  players.sort((a, b) =>
    a.name.localeCompare(b.name.toString(), "en", { sensitivity: "base" })
  );

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
}

function renderPlayersData() {
  // re-render players
  let shouldCreateRows = false;
  let table = document.getElementById("players") as HTMLTableElement;
  if (table.rows.length == 1) {
    shouldCreateRows = true;
  }

  for (let playerId = 0; playerId < players.length; playerId++) {
    let player = players[playerId];
    //console.log(JSON.stringify(player, null, 2));

    let table = document.getElementById("players") as HTMLTableElement;
    let row: HTMLTableRowElement;
    if (shouldCreateRows) {
      row = table.insertRow(-1);
      for (let cellId = 0; cellId < cellsTemplate.length; cellId++) {
        row.insertCell();
      }
    } else row = table.rows[playerId + 1]; // first row is header

    // Add some effects for changed cells
    // if (player.changed == true) {
    //   $(`#players tbody tr:nth-child(${playerId + 2})`).addClass("loading");
    // } else {
    //   $(`#players tbody tr:nth-child(${playerId + 2})`).removeClass("loading");
    // }

    row.cells[0].innerHTML = `<a href="https://beta.11-stats.com/stats/${player.id}/statistics" target="_blank">📈</a>`;
    row.cells[1].innerHTML = `<a href="https://www.elevenvr.net/eleven/${player.id}" target="_blank">${player.id}</a>`;
    row.cells[2].innerHTML = `${player.name}${
      player.id === 500126 ? "（教官)" : ""
    }`;
    row.cells[3].innerHTML = `${player.ELO}${
      player.rank <= 1000 ? " (#" + player.rank.toString() + ")" : ""
    }`;
    row.cells[4].innerHTML = `${
      player.online ? "✔️(" + player.device + ")" : "❌"
    }`;

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
  // $("#players tbody td:nth-child(3)").fadeOut();
  // $("#players tbody td:nth-child(4)").fadeOut();
  // $("#players tbody td:nth-child(5)").fadeOut();
}

function postLoading() {
  updateInfo(`Done`);
  // $("#players tbody td:nth-child(3)").fadeIn();
  // $("#players tbody td:nth-child(4)").fadeIn();
  // $("#players tbody td:nth-child(5)").fadeIn();
}
async function loadAndRender() {
  preLoading();

  await loadPlayersData();

  renderPlayersData();
  postLoading();
}

const refreshInterval = 60; // seconds
let seconds = refreshInterval;

function updateTimerInfo() {
  updateInfo(`Updating in ${seconds} seconds`);
  if (seconds == 1) {
    seconds = refreshInterval;
  } else {
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
