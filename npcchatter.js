class NpcChatter {
  
  static timer;

  getRandomIndex(iterable) {
    return Math.floor((Math.random() * iterable.length))
  }

  getChatterTables() {
    const chatterFolder = game.folders.contents.find(x => x.type == "RollTable" && x.name.toLowerCase() == "npc chatter");

    if ( !chatterFolder ) {
      ui.notifications.warn("Could not find the 'NPC Chatter' Folder");

      return [];
    }

    return chatterFolder.contents;
  }

  randomGlobalChatterEvery(milliseconds, options={}) {
    NpcChatter.timer = window.setInterval(() => { game.npcChatter.globalChatter(options); }, milliseconds);
  }

  static _getChatterScene() {
    const sceneType = game.settings.get("npc-chatter", "scenetype");

    switch (sceneType) {
      case "active": return game.scenes.active;
      case "viewed": return game.scenes.get(game.user.viewedScene);
    }
  }

  async globalChatter(options={}) {
    const chatterTables = this.getChatterTables();
    const scene = NpcChatter._getChatterScene();
    const npcTokenNames = new Set(Object.values(scene.tokens.contents).map(t => t.name.toLowerCase()));
    const eligibleTables = chatterTables.filter(t => npcTokenNames.has(t.name.toLowerCase().replace("chatter", "").trim()));

    if ( eligibleTables.length === 0 ) {
      ui.notifications.warn("You have no NPC Chatter tables set up for these tokens");

      return;
    }

    const table = eligibleTables[this.getRandomIndex(eligibleTables)];
    const eligibleTokens = scene.tokens.contents.filter(
      x => x.name.toLowerCase().includes(table.name.toLowerCase().replace("chatter", "").trim())
    );
    const token = eligibleTokens[this.getRandomIndex(eligibleTokens)];

    if (token == undefined) return;

    const roll = await table.roll();
    const result = roll.results[0].text;

    game.socket.emit("module.npc-chatter", {
      tokenId: token.id,
      msg: result
    });

    const emote = Object.keys(options).length ? {emote: options} : false;

    await canvas.hud.bubbles.say(token, result, emote);
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
    const result = roll.results[0].text;

    game.socket.emit("module.npc-chatter", {
      tokenId: token.id,
      msg: result
    });

    const emote = Object.keys(options).length ? {emote: options} : false;

    await canvas.hud.bubbles.say(token.data, result, emote);
  }

  async selectedChatter(options={}) {
    const npcTokens = canvas.tokens.controlled;
    const tokenIndex = Math.floor((Math.random() * npcTokens.length));
    const token = canvas.tokens.controlled[tokenIndex];

    return this.tokenChatter(token, options);
  }
  
  async turnOffGlobalTimerChatter() {
	  window.clearInterval(NpcChatter.timer);
	  NpcChatter.timer = undefined;
  }
}

Hooks.once('init', async () => {
  game.settings.register("npc-chatter", "scenetype", {
    name: "Should Tokens chatter on the active scene, or the viewed scene?",
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
    let token = canvas.tokens.get(toShow.tokenId);

    canvas.hud.bubbles.say(token, toShow.msg, false);
  });
});

Hooks.on('chatBubble', async function(callerData, html, text, emote) {
  // Fixes https://gitlab.com/foundrynet/foundryvtt/-/issues/3136
  html[0].setAttribute("style", "left: " + callerData.x + "px;");
});
