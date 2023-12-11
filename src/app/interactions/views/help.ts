import {
  APIEmbed,
  APIInteractionResponseChannelMessageWithSource,
  ApplicationCommandType,
  ButtonStyle,
  ComponentType,
  InteractionResponseType,
  MessageFlags,
} from 'discord-api-types/v10'

import { App } from '../../app'

import { Messages } from '../../messages/messages'
import { Colors, dateTimestamp, inviteUrl } from '../../messages/message_pieces'
import { CommandView } from '../../../discord-framework'

const help_command = new CommandView({
  type: ApplicationCommandType.ChatInput,

  command: {
    name: 'help',
    description: 'All about this bot',
  },
  state_schema: {},
})

export default (app: App) =>
  help_command.onCommand(async () => {
    const last_deployed = (await app.db.settings.getOrUpdate()).data.last_deployed

    let last_deployed_timestamp = last_deployed ? dateTimestamp(last_deployed) : 'unknown'

    const embed: APIEmbed = {
      title: 'Leaderboards',
      description: Messages.concise_description,
      fields: [
        {
          name: `Source Code`,
          value: `This bot is open source. [GitHub](${Messages.github_url})`,
        },
        {
          name: `Version`,
          value: `This bot was last updated on ${last_deployed_timestamp}`,
        },
      ],
      color: Colors.EmbedBackground,
    }

    const response: APIInteractionResponseChannelMessageWithSource = {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [embed],
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                url: inviteUrl(app.bot),
                label: 'Invite',
                style: ButtonStyle.Link,
              },
            ],
          },
        ],
        flags: MessageFlags.Ephemeral,
      },
    }
    return response
  })
