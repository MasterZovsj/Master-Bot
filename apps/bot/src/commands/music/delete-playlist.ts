import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { trpcNode } from '../../trpc';
import Logger from '../../lib/logger';

@ApplyOptions<CommandOptions>({
	name: 'delete-playlist',
	description: 'Delete a playlist from your saved playlists',
	preconditions: [
		'GuildOnly',
		'isCommandDisabled',
		'userInDB',
		'playlistExists'
	]
})
export class DeletePlaylistCommand extends Command {
	public override registerApplicationCommands(
		registry: Command.Registry
	): void {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option =>
					option
						.setName('playlist-name')
						.setDescription(
							'What is the name of the playlist you want to delete?'
						)
						.setRequired(true)
				)
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction
	) {
		const playlistName = interaction.options.getString('playlist-name', true);

		const interactionMember = interaction.member?.user;

		if (!interactionMember) {
			return await interaction.reply(
				':x: Something went wrong! Please try again later'
			);
		}

		try {
			const playlist = await trpcNode.playlist.delete.mutate({
				name: playlistName,
				userId: interactionMember.id
			});

			if (!playlist) throw new Error();
		} catch (error) {
			console.log(error);
			Logger.error(error);
			return await interaction.reply(
				':x: Something went wrong! Please try again later'
			);
		}

		return await interaction.reply(`:wastebasket: Deleted **${playlistName}**`);
	}
}
