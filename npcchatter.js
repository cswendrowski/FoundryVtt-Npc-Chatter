class NpcChatter {
  
  static timer;

  getChatterTables() {
    var chatterFolder =game.folders.entities.filter(x => x.type == "RollTable" && x.name.toLowerCase() == "npc chatter")[0];
    var tables = game.tables.entities.filter(x => x.name.toLowerCase().endsWith("chatter") || x.data.folder == chatterFolder.id);
    return tables;
  }

  randomGlobalChatterEvery(milliseconds) {
    NpcChatter.timer = window.setInterval(() => { game.npcChatter.globalChatter(); }, milliseconds);
  }

  async globalChatter() {
    var tables = this.getChatterTables();

    var userCharacterActorIds = game.users.entities.filter(x => x.character).map(x => x.character.id);
    var activeScene = game.scenes.filter(x => x.active)[0];
    var npcTokens = activeScene.data.tokens.filter(x => !userCharacterActorIds.includes(x.actorId));

    var eligableTables = tables.filter(x => npcTokens.filter(t => x.name.toLowerCase().includes(t.name.toLowerCase().replace("chatter", "").trim()) > 0));

    var tableIndex = Math.floor((Math.random() * eligableTables.length) + 0);
    var table = eligableTables[tableIndex];

    var eligableTokens = npcTokens.filter(x => x.name.toLowerCase().includes(table.name.toLowerCase().replace("chatter", "").trim()));

    var tokenIndex = Math.floor((Math.random() * eligableTokens.length) + 0);
    var token = eligableTokens[tokenIndex];

    var result = table.roll().results[0].text;
    await canvas.hud.bubbles.say(token, result, false);
  }

  async tokenChatter(token) {
    var tables = this.getChatterTables();

    var eligableTables = tables.filter(x => token.name.toLowerCase().includes(x.name.toLowerCase().replace("chatter", "").trim()));

    if (eligableTables.length == 0) return;

    var tableIndex = Math.floor((Math.random() * eligableTables.length) + 0);
    var table = eligableTables[tableIndex];

    var result = table.roll().results[0].text;
    await canvas.hud.bubbles.say(token, result, false);
  }

  async selectedChatter() {
    var tables = this.getChatterTables();

    var npcTokens = canvas.tokens.controlled;

    var eligableTables = tables.filter(x => npcTokens.filter(t => x.name.toLowerCase().includes(t.name.toLowerCase().replace("chatter", "").trim()) > 0));

    if (eligableTables.length == 0) return;

    var tableIndex = Math.floor((Math.random() * eligableTables.length) + 0);
    var table = eligableTables[tableIndex];

    var eligableTokens = npcTokens.filter(x => x.name.toLowerCase().includes(table.name.toLowerCase().replace("chatter", "").trim()));

    var tokenIndex = Math.floor((Math.random() * eligableTokens.length) + 0);
    var token = eligableTokens[tokenIndex];

    var result = table.roll().results[0].text;
    await canvas.hud.bubbles.say(token, result, false);
  }
  
  async turnOffGlobalTimerChatter() {
	  window.clearInterval(NpcChatter.timer);
	  NpcChatter.timer = undefined;
  }
}

Hooks.once('ready', async function() {
  game.npcChatter = new NpcChatter();
  console.log("Npc Chatter is now ready");
});

Hooks.on('chatBubble', async function(callerData, html, text, emote) {
  // Fixes https://gitlab.com/foundrynet/foundryvtt/-/issues/3136
  html[0].setAttribute("style", "left: " + callerData.x + "px;");
});
