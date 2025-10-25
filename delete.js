require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});
async function deleteAllBotMessages(guild) {
    for (const [channelId, channel] of guild.channels.cache) {
        if (!channel.isTextBased()) continue;

        console.log(`🧹 Cleaning #${channel.name}...`);

        let hasMore = true;

        while (hasMore) {
            try {
                // Fetch up to 100 messages
                const fetched = await channel.messages.fetch({ limit: 100 });
                const botMessages = fetched.filter(m => m.author.id === client.user.id);

                for (const msg of botMessages.values()) {
                    const preview = msg.content.split(" ").slice(0, 4).join(" ");
                    console.log(`🗑 Deleting message by ${msg.author.username}: "${preview}..."`);

                    try {
                        await msg.delete();
                        await new Promise(r => setTimeout(r, 250)); // small delay
                    } catch (err) {
                        console.log(`⚠️ Could not delete a message in #${channel.name}: ${err.message}`);
                    }
                }

                hasMore = botMessages.size > 0;
            } catch (err) {
                console.log(`⚠️ Failed to fetch messages in #${channel.name}: ${err.message}`);
                hasMore = false;
            }
        }
    }
}

client.on('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    
    // Loop through all guilds
    for (const [guildId, guild] of client.guilds.cache) {
        console.log(`🔍 Cleaning messages in guild: ${guild.name}`);
        await deleteAllBotMessages(guild);
    }

    console.log("✅ Finished deleting all bot messages. Exiting...");
    process.exit(0); // Exit bot after cleanup
});

client.login(process.env.TOKEN);
