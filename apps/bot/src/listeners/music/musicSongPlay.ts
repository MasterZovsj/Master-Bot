import { ApplyOptions } from '@sapphire/decorators';
import { container, Listener, type ListenerOptions } from '@sapphire/framework';
import type { Queue } from '../../lib/music/classes/Queue';
import type { Song } from '../../lib/music/classes/Song';

@ApplyOptions<ListenerOptions>({
	name: 'musicSongPlay'
})
export class MusicSongPlayListener extends Listener {
	public override async run(queue: Queue, track: Song): Promise<void> {
		const channel = await queue.getTextChannel();
		if (channel) {
			const { client } = container;

			clearTimeout(client.leaveTimers[queue.player.guildId]);
			delete client.leaveTimers[queue.player.guildId];
			// Leave Voice Channel when attempting to stream to an empty channel

			if (channel.guild.members.me?.voice.channel?.members.size == 1) {
				await queue.leave();
				return;
			}
			queue.client.emit('musicSongPlayMessage', channel, track);
		}
	}
}
