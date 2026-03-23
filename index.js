const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const mineflayer = require('mineflayer');

// --- Environment Variables ---
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// --- Discord Client Setup ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let bots = [];

// --- Register Slash Commands ---
const commands = [
  new SlashCommandBuilder()
    .setName('join')
    .setDescription('AFK bot joins a server')
    .addStringOption(opt => opt.setName('ip').setDescription('Server IP').setRequired(true))
    .addStringOption(opt => opt.setName('name').setDescription('Bot username').setRequired(true)),
    
  new SlashCommandBuilder()
    .setName('leave')
    .setDescription('AFK bot leaves the server')
    .addStringOption(opt => opt.setName('name').setDescription('Bot username').setRequired(true)),
    
  new SlashCommandBuilder()
    .setName('list')
    .setDescription('List all AFK bots')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
  .then(() => console.log('✅ Commands registered'))
  .catch(console.error);

// --- Discord Bot Events ---
client.once('ready', () => console.log(`Logged in as ${client.user.tag}`));

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'join') {
    const ip = interaction.options.getString('ip');
    const username = interaction.options.getString('name');

    const bot = mineflayer.createBot({
      host: ip,
      username,
      auth: 'offline'
    });

    bots.push(bot);

    bot.on('login', () => console.log(`Bot ${username} joined ${ip}`));
    bot.on('end', () => {
      bots = bots.filter(b => b !== bot);
      console.log(`Bot ${username} disconnected`);
    });

    await interaction.reply(`✅ Bot ${username} joined ${ip}`);
  }

  if (interaction.commandName === 'leave') {
    const username = interaction.options.getString('name');
    const bot = bots.find(b => b.username === username);
    if (bot) {
      bot.quit();
      bots = bots.filter(b => b !== bot);
      await interaction.reply(`❌ Bot ${username} left`);
    } else {
      await interaction.reply(`⚠️ Bot ${username} not found`);
    }
  }

  if (interaction.commandName === 'list') {
    await interaction.reply(`🤖 Bots: ${bots.map(b => b.username).join(', ') || 'None'}`);
  }
});

client.login(DISCORD_TOKEN);
