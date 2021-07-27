class NpcChatter {
  
  static timer;

  getChatterTables() {
    const chatterFolder = game.folders.contents.filter(x => x.type == "RollTable" && x.name.toLowerCase() == "npc chatter")[0];
    const tables = game.tables.contents.filter(x => x.name.toLowerCase().endsWith("chatter") || x.data.folder == chatterFolder._id);
    return tables;
  }

  randomGlobalChatterEvery(milliseconds, options={}) {
    NpcChatter.timer = window.setInterval(() => { game.npcChatter.globalChatter(options); }, milliseconds);
  }

  async globalChatter(options={}) {
    const tables = this.getChatterTables();

    const userCharacterActorIds = game.users.contents.filter(x => x.character).map(x => x.character.id);
    const activeScene = game.scenes.filter(x => x.active)[0];
    const npcTokens = activeScene.data.tokens.filter(x => !userCharacterActorIds.includes(x.actorId));

    const eligableTables = tables.filter(x => npcTokens.filter(t => x.name.toLowerCase().includes(t.name.toLowerCase().replace("chatter", "").trim()) > 0));

    const tableIndex = Math.floor((Math.random() * eligableTables.length) + 0);
    const table = eligableTables[tableIndex];

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
    const tables = this.getChatterTables();

    const eligableTables = tables.filter(x => token.name.toLowerCase().includes(x.name.toLowerCase().replace("chatter", "").trim()));

    if (eligableTables.length == 0) return;

    const tableIndex = Math.floor((Math.random() * eligableTables.length) + 0);
    const table = eligableTables[tableIndex];
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
    const tables = this.getChatterTables();

    const npcTokens = canvas.tokens.controlled;

    const eligableTables = tables.filter(x => npcTokens.filter(t => x.name.toLowerCase().includes(t.name.toLowerCase().replace("chatter", "").trim()) > 0));

    if (eligableTables.length == 0) return;

    const tableIndex = Math.floor((Math.random() * eligableTables.length) + 0);
    const table = eligableTables[tableIndex];

    const eligableTokens = npcTokens.filter(x => x.name.toLowerCase().includes(table.name.toLowerCase().replace("chatter", "").trim()));

    const tokenIndex = Math.floor((Math.random() * eligableTokens.length) + 0);
    const token = eligableTokens[tokenIndex];
    let roll = await table.roll();
    const result = roll.results[0].data.text;
    game.socket.emit("module.npc-chatter", {
      tokenId: token.id,
      msg: result
    });
    const emote = Object.keys(options).length ? {emote: options} : false;
    await canvas.hud.bubbles.say(token, result, emote);
  }
  
  async turnOffGlobalTimerChatter() {
	  window.clearInterval(NpcChatter.timer);
	  NpcChatter.timer = undefined;
  }
}

Hooks.once('ready', async function() {
  game.npcChatter = new NpcChatter();
  console.log("Npc Chatter is now ready");

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
