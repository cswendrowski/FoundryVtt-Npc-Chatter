class NpcChatter {
  
  static timer;

  getChatterTables() {
    const chatterFolder = game.folders.contents.find(x => x.type == "RollTable" && x.name.toLowerCase() == "npc chatter");
    if ( !chatterFolder ) {
      ui.notifications.warn("Could not find the 'NPC Chatter' Folder");
      return [];
    }
    const tables = game.tables.contents.filter(x => x.name.toLowerCase().endsWith("chatter") || x.data.folder == chatterFolder.id);
    return tables;
  }

  randomGlobalChatterEvery(milliseconds, options={}) {
    NpcChatter.timer = window.setInterval(() => { game.npcChatter.globalChatter(options); }, milliseconds);
  }

  static _getChatterScene() {
    const sceneType = game.settings.get("npc-chatter", "scenetype");
    switch (sceneType) {
      case "active": return game.scenes.find(x => x.active);
      case "viewed": return game.scenes.find(x => x.id === game.user.viewedScene);
    }
  }

  async globalChatter(options={}) {
    const tables = this.getChatterTables();

    const userCharacterActorIds = game.users.contents.filter(x => x.character).map(x => x.character.id);
    const scene = NpcChatter._getChatterScene();
    const npcTokens = scene.data.tokens.filter(x => !userCharacterActorIds.includes(x.actorId));

    const eligibleTables = tables.filter(x => npcTokens.filter(t => x.name.toLowerCase().includes(t.name.toLowerCase().replace("chatter", "").trim()) > 0));
    if ( eligibleTables.length === 0 ) {
      ui.notifications.warn("You have no NPC Chatter tables setup for these tokens");
      return;
    }

    const tableIndex = Math.floor((Math.random() * eligibleTables.length) + 0);
    const table = eligibleTables[tableIndex];

    const eligableTokens = npcTokens.filter(x => x.name.toLowerCase().includes(table.name.toLowerCase().replace("chatter", "").trim()));

    const tokenIndex = Math.floor((Math.random() * eligableTokens.length) + 0);
    const token = eligableTokens[tokenIndex];

    if (token == undefined) return;


    let roll = await table.roll();
    const result = roll.results[0].data.text;
    game.socket.emit("module.npc-chatter", {
      tokenId: token.data._id,
      msg: result
    });
    const emote = Object.keys(options).length ? {emote: options} : false;
    await canvas.hud.bubbles.say(token.data, result, emote);
  }

  async tokenChatter(token, options={}) {
    if ( !token ) {
      ui.notifications.error("No Token passed in");
      return;
    }
    const tables = this.getChatterTables();

    const eligibleTables = tables.filter(x => token.name.toLowerCase().includes(x.name.toLowerCase().replace("chatter", "").trim()));
    if ( eligibleTables.length === 0 ) {
      ui.notifications.warn("You have no NPC Chatter tables setup for this token");
      return;
    }

    const tableIndex = Math.floor((Math.random() * eligibleTables.length) + 0);
    const table = eligibleTables[tableIndex];
    let roll = await table.roll();
    const result = roll.results[0].data.text;
    game.socket.emit("module.npc-chatter", {
      tokenId: token.data._id,
      msg: result
    });
    const emote = Object.keys(options).length ? {emote: options} : false;
    await canvas.hud.bubbles.say(token.data, result, emote);
  }

  async selectedChatter(options={}) {
    const npcTokens = canvas.tokens.controlled;
    const tokenIndex = Math.floor((Math.random() * npcTokens.length) + 0);
    const token = npcTokens[tokenIndex];
    return this.tokenChatter(token, options);
  }
  
  async turnOffGlobalTimerChatter() {
	  window.clearInterval(NpcChatter.timer);
	  NpcChatter.timer = undefined;
  }
}

Hooks.once('init', async () => {
  game.settings.register("npc-chatter", "scenetype", {
    name: "Should Tokens Chatter on the active scene, or the viewed scene?",
    type: String,
    config: true,
    scope: "world",
    default: "viewed",
    choices: {
      active: "Active Scene",
      viewed: "Viewed Scene"
    }
  });
});

Hooks.once('ready', async () => {
  game.npcChatter = new NpcChatter();

  game.socket.on("module.npc-chatter", async (toShow) => {
    //console.log("Got token " + toShow.tokenId + " with text " + toShow.msg);
    let token = canvas.tokens.get(toShow.tokenId);
    //console.log(token);
    canvas.hud.bubbles.say(token, toShow.msg, false);
  });
});

Hooks.on('chatBubble', async function(callerData, html, text, emote) {
  // Fixes https://gitlab.com/foundrynet/foundryvtt/-/issues/3136
  html[0].setAttribute("style", "left: " + callerData.x + "px;");
});
