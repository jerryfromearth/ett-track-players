# Eleven Table Tennis Player Tracker

## Overview

This is a frontend-only website that can show a list of ETT (Eleven Table Tennis) players and their current status (ELO, rank, online status, opponent). 
Also contains some useful links to other ETT websites.

Demo: http://ett.jerryhong.net

![image](https://user-images.githubusercontent.com/343557/138462371-b1abce79-7da0-4368-91a7-763a359166b1.png)

## To use

There are two ways to use it.

If you have a web server, please download the code (https://github.com/jerryfromearth/ett-track-players/archive/refs/heads/main.zip), edit `players.json` and upload the folder to your website.

If you don't have a web server, welcome to just use my github page. You can customize the link to include the player IDs you want to track. For example, https://jerryfromearth.github.io/ett-track-players/?ids=4008,4009 would track the players with id 4008 and 4009. (Player IDs can be found on https://www.elevenvr.net/)

## To develop

The code is written in Typescript (in `src/` folder) and then compiled into Javascript (in `dist` folder).
Run `npm compile` and `npm start` if you want to try out some modifications to the typescript code.

Feel free to create issues / pull requests!

## Notes

Currently it has a hardcoded `maxPlayers` limit to avoid flooding the ETT servers. I'm not responsible for any damage done if you overwrite this limit.

Some source that this code fetches is only served over http. So if your own website is running over https, it _might_ have problem fetching that source (I've used a CORS Proxy to get around the problem, but can't guarantee that it'll always work in the future).
