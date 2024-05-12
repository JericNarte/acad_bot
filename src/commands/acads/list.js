const { ApplicationCommandOptionType } = require('discord.js');
const { groupEvents, filterValidEvents } = require('../../utils/calendar');
const { extractCommandOptions, calculateSearchSpan } = require('../../utils/commands');
const {
    generateCommandScript,
    generateDateScript,
    generateValidEventScript,
    generateInvalidEventScript,
} = require('../../utils/scripts');
const { fetchCalendarEvents } = require('../../database/calendar');

// Slash command options
const commandOptions = [
    {
        name: 'span',
        description: 'Number of weeks to show. [ default : 1 week]',
        type: ApplicationCommandOptionType.Number,
        required: false,
        choices: [
            { name: '1 week', value: 1 },
            { name: '2 weeks', value: 2 },
            { name: '3 weeks', value: 3 },
            { name: '4 weeks', value: 4 },
        ],
        default: 1,
    },
    {
        name: 'start',
        description: 'Start date of the search. [ default : monday ]',
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
            { name: 'monday', value: 'monday' },
            { name: 'today', value: 'today' },
        ],
        default: 'monday',
    },
    {
        name: 'group',
        description: 'Set how the events are grouped. [ default : date ]',
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
            { name: 'date', value: 'date' },
            { name: 'subject', value: 'subject' },
        ],
        default: 'subject',
    },
];

// Function to handle the command execution
async function commandCallback(client, interaction) {
    // Defer replying to let the user know that the bot has received the interaction
    await interaction.deferReply();

    // Extract user options from the interaction
    const options = extractCommandOptions(interaction, commandOptions);

    // Determine the search interval based on the user-provided options
    const date = calculateSearchSpan(options.span, options.start);

    // Fetch events from Google Calendar
    let calendarEvents;
    try {
        calendarEvents = await fetchCalendarEvents(date.start, date.end);
    } catch (error) {
        // If there's an error, inform the user and exit
        console.error(`🟥 Calendar Request Failed : ${error}`);
        await interaction.editReply('[ERROR] Calendar Request Failed');
        return;
    }

    // Separate valid and invalid events
    const { validEvents, invalidEvents } = filterValidEvents(calendarEvents);

    // Apply grouping to valid events
    const groupedEvents = groupEvents(validEvents, options.group);

    // Generate the response script
    const commandScript = generateCommandScript('list', options, commandOptions);
    const dateScript = generateDateScript(date);
    const validScript = generateValidEventScript(groupedEvents);
    const invalidScript = generateInvalidEventScript(invalidEvents);

    // Send the response script as a reply
    const responseScript = `${commandScript}${dateScript}${validScript}${invalidScript}`;
    await interaction.editReply(responseScript);
}

module.exports = {
    deleted: false,
    devOnly: true,
    allowedServerOnly: true,
    devServerOnly: true,
    name: 'list',
    description: 'List events from google calendar.',
    options: commandOptions,
    callback: commandCallback,
};
