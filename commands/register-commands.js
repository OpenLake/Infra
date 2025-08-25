const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register yourself for the gamification system'),
    async execute(interaction, points, saveData) {
        const userId = interaction.user.id;
        if (points[userId]) {
            return interaction.reply({ content: 'You are already registered!', ephemeral: true });
        }
        points[userId] = 0;
        saveData();
        interaction.reply({ content: 'You have been registered successfully! 🎉', ephemeral: true });
    }

};
