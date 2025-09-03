require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder, Collection } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// ---------------------- DISCORD CLIENT ----------------------
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

// ---------------------- VARIABLES ----------------------
let postedPRs = [];
let postedIssues = [];
let points = {};

const repoConfig = require('./database/repoChannels.json');
const REPO_CHANNELS = repoConfig.repos;
const GENERAL_CHANNEL_NAME = repoConfig.generalChannel;

const DATA_FILE = './botData.json';
const FETCH_INTERVAL = 1000 * 60 * 4;

// ---------------------- LOAD SAVED DATA ----------------------
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

// ---------------------- FETCH PRs & ISSUES ----------------------
async function fetchPRsAndIssues(repo) {
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const prUrl = `https://api.github.com/repos/${repo}/pulls`;
    const issuesUrl = `https://api.github.com/repos/${repo}/issues`;


    try {
        console.log("prs");
        const prsResponse = await fetch(prUrl, { headers });
        console.log("issues")
        const issuesResponse = await fetch(issuesUrl, { headers });
        const prs = await prsResponse.json();
        console.log("prs.json");
        
        const issues = await issuesResponse.json();
console.log("issues.json");
        
        return {
            prs: Array.isArray(prs) ? prs : [],
            issues: Array.isArray(issues) ? issues : []
        };
    } catch (error) {
        console.error(`❌ Error fetching PRs & issues for ${repo}:`, error);
        return { prs: [], issues: [] };
    }
}

// ---------------------- POST PRs & ISSUES ----------------------
async function postNewPRsAndIssues() {
    const guild = client.guilds.cache.first();
    if (!guild) {
        console.error("Bot is not in any guild!");
        return;
    }

    let openPRs = [];
    let openIssues = [];

    // Process repos from JSON only
    for (const repo of Object.keys(REPO_CHANNELS)) {
        const { prs, issues } = await fetchPRsAndIssues(repo);

        // Collect currently open PRs & issues
        openPRs.push(...prs.map(pr => pr.html_url));
        openIssues.push(...issues.map(issue => issue.html_url));

        const repoChannelName = REPO_CHANNELS[repo];
        const repoChannel = guild.channels.cache.find(ch => ch.name === repoChannelName && ch.isTextBased());

        if (!repoChannel) {
            console.log(`⚠️ Repo channel ${repoChannelName} not found, skipping.`);
            continue;
        }

        // --- Post New PRs ---
        const newPRs = prs.filter(pr => !postedPRs.includes(pr.html_url));
        for (const pr of newPRs.slice(0, 5)) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: pr.user.login, iconURL: pr.user.avatar_url, url: pr.user.html_url })
                .setTitle(`🔹 ${pr.title}`)
                .setURL(pr.html_url)
                .setDescription(
                    `**Repository:** ${repo}\n` +
                    `**Status:** ${pr.draft ? "🚧 Draft" : pr.state === "open" ? "🟢 Open" : "✅ Closed"}\n\n` +
                    `${pr.body ? pr.body.slice(0, 300) + (pr.body.length > 300 ? "..." : "") : "No description"}`
                )
                .setColor(0x3498DB)
                .setFooter({ text: `PR #${pr.number} | Created at` })
                .setTimestamp(new Date(pr.created_at));

            await repoChannel.send({ embeds: [embed] });
            postedPRs.push(pr.html_url);
        }

        // --- Post Issues ---
        const newIssues = issues.filter(issue => !postedIssues.includes(issue.html_url));
        for (const issue of newIssues.slice(0, 5)) {
            const labels = issue.labels?.length
                ? issue.labels.map(label => `\`${label.name}\``).join(", ")
                : "None";

            // Detailed issue in repo channel
            const detailedEmbed = new EmbedBuilder()
                .setAuthor({ name: issue.user.login, iconURL: issue.user.avatar_url, url: issue.user.html_url })
                .setTitle(`📝 Issue: ${issue.title}`)
                .setURL(issue.html_url)
                .setDescription(
                    `**Repository:** ${repo}\n` +
                    `**Labels:** ${labels}\n\n` +
                    `**Description:**\n${issue.body || "No description provided."}`
                )
                .setColor(0xE67E22)
                .setFooter({ text: `Issue #${issue.number} | Created at` })
                .setTimestamp(new Date(issue.created_at));

            await repoChannel.send({ embeds: [detailedEmbed] });

            // Good first issues → post in general
            if (issue.labels?.some(label => label.name.toLowerCase() === "good first issue")) {
                const generalChannel = guild.channels.cache.find(ch => ch.name === GENERAL_CHANNEL_NAME && ch.isTextBased());
                if (generalChannel) {
                    const briefEmbed = new EmbedBuilder()
                        .setTitle(`🟢 Good First Issue: ${issue.title}`)
                        .setURL(issue.html_url)
                        .setDescription(`**Repository:** ${repo}\n**Author:** ${issue.user.login}`)
                        .setColor(0x2ECC71);

                    await generalChannel.send({ embeds: [briefEmbed] });
                }
            }

            postedIssues.push(issue.html_url);
        }
    }

    // 🧹 Clean up solved PRs & Issues
    postedPRs = postedPRs.filter(url => openPRs.includes(url));
    postedIssues = postedIssues.filter(url => openIssues.includes(url));

    // Save updated data
    saveData();
}

// ---------------------- BOT START ----------------------
setInterval(() => {
    postNewPRsAndIssues().catch(console.error);
}, FETCH_INTERVAL);

client.on('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    postNewPRsAndIssues();
});

client.login(process.env.TOKEN);
