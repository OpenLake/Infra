require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder, Collection } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

// --- Load data ---
let postedPRs = [];
let postedIssues = [];
let points = {};

const DATA_FILE = './botData.json';

if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE);
    const savedData = JSON.parse(raw);
    postedPRs = savedData.postedPRs || [];
    postedIssues = savedData.postedIssues || [];
    points = savedData.points || {};
}

function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ postedPRs, postedIssues, points }, null, 2));
}

// --- Commands ---
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, points, saveData);
    } catch (error) {
        console.error(error);
        interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
    }
});

client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === 'general');
    if (!channel) return;

    channel.send(`
🎉 Welcome to **${member.guild.name}**, ${member}!

We’re excited to have you here. Here’s how to get started:

1️⃣ Read the [Server Rules](https://discord.com/channels/your-server-id/rules-channel-id) 📜  
2️⃣ Introduce yourself in the #introductions channel 👋  
3️⃣ Check out our [GitHub Organization](https://github.com/OpenLake) to explore projects 💻  
4️⃣ Ask questions or discuss in #general 💬  

Make sure to react to the rules to get full access to the server ✅

Let’s build something amazing together! 🚀
`);
});
// --- Points/gamification ---
client.on('messageCreate', message => {
    if (message.author.bot) return;

    const userId = message.author.id;
    points[userId] = (points[userId] || 0) + 1;

    if (points[userId] % 10 === 0) {
        message.channel.send(`${message.author.username} reached ${points[userId]} points! 🎉`);
    }

    saveData();
});

// --- GitHub Fetching ---
const REPO_LIST = ['OpenLake/Not-a-Mess','OpenLake/student_database_cosa']; // Add your repos
const FETCH_INTERVAL = 1000 * 30; // 30 min
async function fetchPRsAndIssues(repo) {
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
    };

    // Use token if available
    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const prUrl = `https://api.github.com/repos/${repo}/pulls`;
    const issuesUrl = `https://api.github.com/repos/${repo}/issues?labels=good%20first%20issue`;

    try {
        const prsResponse = await fetch(prUrl, { headers });
        const issuesResponse = await fetch(issuesUrl, { headers });

        const prs = await prsResponse.json();
        const issues = await issuesResponse.json();

        // Check for API errors
        if (!Array.isArray(prs)) {
            console.error(`Failed to fetch PRs for ${repo}:`, prs);
            return { prs: [], issues: Array.isArray(issues) ? issues : [] };
        }

        if (!Array.isArray(issues)) {
            console.error(`Failed to fetch issues for ${repo}:`, issues);
            return { prs, issues: [] };
        }
        console.log(prs,issues);
        return { prs, issues };
    } catch (error) {
        console.error(`Error fetching PRs and issues for ${repo}:`, error);
        return { prs: [], issues: [] };
    }
}
async function postNewPRsAndIssues() {
    for (const repo of REPO_LIST) {
        const { prs, issues } = await fetchPRsAndIssues(repo);

        const repoName = repo.split('/')[1].toLowerCase();
        const guild = client.guilds.cache.first();
        if (!guild) {
            console.error("Bot is not in any guild!");
            continue;
        }
 
        let channel = guild.channels.cache.find(ch => ch.name === repoName && ch.isTextBased());
        if (!channel) {
            console.log(`Creating channel for ${repoName}...`);
            channel = await guild.channels.create({
                name: repoName,
                type: 0 // GUILD_TEXT
            });
        } 
        const newPRs = prs.filter(pr => !postedPRs.includes(pr.html_url));
        for (const pr of newPRs.slice(0, 5)) {
            const author = pr.user.login;
            const avatarUrl = pr.user.avatar_url;
            const body = pr.body ? pr.body.slice(0, 300) + (pr.body.length > 300 ? "..." : "") : "No description provided.";
            const status = pr.draft ? "🚧 Draft" : pr.state === "open" ? "🟢 Open" : "✅ Merged/Closed";
            const labels = pr.labels?.length
                ? pr.labels.map(label => `\`${label.name}\``).join(", ")
                : "None";

            const embed = new EmbedBuilder()
                .setAuthor({ name: author, iconURL: avatarUrl, url: pr.user.html_url })
                .setTitle(`🔹 ${pr.title}`)
                .setURL(pr.html_url)
                .setDescription(
                    `**Repository:** ${repo}\n` +
                    `**Status:** ${status}\n` +
                    `**Labels:** ${labels}\n\n` +
                    `**Description:**\n${body}`
                )
                .setColor(0x3498DB)
                .setFooter({ text: `PR #${pr.number} | Created at` })
                .setTimestamp(new Date(pr.created_at));

            await channel.send({ embeds: [embed] });
            postedPRs.push(pr.html_url);
        }
 
        const newIssues = issues.filter(issue => !postedIssues.includes(issue.html_url));
        for (const issue of newIssues.slice(0, 5)) {
            const author = issue.user.login;
            const avatarUrl = issue.user.avatar_url;
            const body = issue.body ? issue.body.slice(0, 300) + (issue.body.length > 300 ? "..." : "") : "No description provided.";
            const labels = issue.labels?.length
                ? issue.labels.map(label => `\`${label.name}\``).join(", ")
                : "None";

            const embed = new EmbedBuilder()
                .setAuthor({ name: author, iconURL: avatarUrl, url: issue.user.html_url })
                .setTitle(`🟢 Good First Issue: ${issue.title}`)
                .setURL(issue.html_url)
                .setDescription(
                    `**Repository:** ${repo}\n` +
                    `**Labels:** ${labels}\n\n` +
                    `**Description:**\n${body}`
                )
                .setColor(0xE67E22)
                .setFooter({ text: `Issue #${issue.number} | Created at` })
                .setTimestamp(new Date(issue.created_at));

            await channel.send({ embeds: [embed] });
            postedIssues.push(issue.html_url);
        }

        saveData();
    }
}


// Run periodically
setInterval(() => {
    postNewPRsAndIssues().catch(console.error);
}, FETCH_INTERVAL);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    postNewPRsAndIssues(); 
});

client.login(process.env.TOKEN);
