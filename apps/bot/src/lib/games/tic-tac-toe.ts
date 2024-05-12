import { createCanvas, Image } from '@napi-rs/canvas';
import axios from 'axios';
import {
	AttachmentBuilder,
	EmbedBuilder,
	MessageReaction,
	User,
	Message,
	ChatInputCommandInteraction,
	Colors
} from 'discord.js';
import { playersInGame } from '../../commands/other/games';
import Logger from '../logger';

export class TicTacToeGame {
	public async ticTacToe(
		interaction: ChatInputCommandInteraction,
		playerMap: Map<string, User>
	) {
		const player1 = interaction.user;
		let player2: User;
		playerMap.forEach(player => {
			if (player.id !== player1.id) player2 = player;
		});

		const player1Avatar = player1.displayAvatarURL({
			extension: 'jpg'
		});
		const player1Image = await axios.request({
			responseType: 'arraybuffer',
			url: player1Avatar
		});

		const player1Piece = new Image();
		player1Piece.src = Buffer.from(await player1Image.data);

		const player2Avatar = player2!.displayAvatarURL({
			extension: 'jpg'
		});

		const player2Image = await axios.request({
			responseType: 'arraybuffer',
			url: player2Avatar
		});
		const player2Piece = new Image();
		player2Piece.src = Buffer.from(await player2Image.data);
		await game(player1, player2!);
		async function game(player1: User, player2: User) {
			let gameBoard: number[][] = [
				[0, 0, 0], //row 1
				[0, 0, 0],
				[0, 0, 0]
				// column ->
			];

			let rowChoice: number | null = null;
			let columnChoice: number | null = null;

			let currentPlayer = player1.id;
			let boardImageURL: string | null = null;

			let currentTurn = 0;
			await createBoard();
			++currentTurn;

			const Embed = new EmbedBuilder()
				.setThumbnail(player1Avatar)
				.setColor(Colors.Red)
				.setTitle(`Tic Tac Toe - Player 1's Turn`)
				.setDescription(
					`Use the emojis 1️⃣, 2️⃣, 3️⃣ for columns and 🇦, 🇧, 🇨 for rows.\n
        You must click both a **Number** and a **Letter** to place your colored square in that space.\n
        You have 1 minute per turn or it's an automatic forfeit.
        Incase of invisible board click 🔄.`
				)
				.addFields(
					{ name: 'Column', value: 'None', inline: true },
					{ name: 'Row', value: 'None', inline: true }
				)
				.setImage(boardImageURL!)
				.setFooter({ text: 'Incase of invisible board click 🔄' })
				.setTimestamp();

			await interaction.channel
				?.send({ embeds: [Embed] })

				.then(async message => {
					const embed = new EmbedBuilder(message.embeds[0].data);
					try {
						await message.react('1️⃣');
						await message.react('2️⃣');
						await message.react('3️⃣');
						await message.react('🇦');
						await message.react('🇧');
						await message.react('🇨');
						await message.react('🔄');
					} catch (error) {
						Logger.error(`Tic-Tac-Toe - ` + error);
					}

					const filter = (reaction: MessageReaction) => {
						return (
							reaction.emoji.name === '1️⃣' ||
							reaction.emoji.name === '2️⃣' ||
							reaction.emoji.name === '3️⃣' ||
							reaction.emoji.name === '🇦' ||
							reaction.emoji.name === '🇧' ||
							reaction.emoji.name === '🇨' ||
							reaction.emoji.name === '🔄'
						);
					};

					const gameCollector = message.createReactionCollector({
						filter: filter,
						idle: 60 * 1000
					});

					gameCollector.on(
						'collect',
						async function (reaction: MessageReaction, user: User) {
							// Reset the Reactions
							if (user.id !== interaction.applicationId)
								await reaction.users.remove(user).catch(error => {
									Logger.error(`Tic-Tac-Toe - ` + error);
								});

							// Refresh Image
							if (
								reaction.emoji.name === '🔄' &&
								(user.id === player1.id || user.id === player2.id)
							) {
								embed.setImage(boardImageURL!);
								await message.edit({
									embeds: [embed]
								});
							}

							if (user.id !== currentPlayer) {
								return;
							}
							// Column 1
							if (reaction.emoji.name === '1️⃣') {
								columnChoice = 0;
								await playerMove(rowChoice!, columnChoice, user, embed);
							}
							// Column 2
							if (reaction.emoji.name === '2️⃣') {
								columnChoice = 1;
								await playerMove(rowChoice!, columnChoice, user, embed);
							}
							// Column 3
							if (reaction.emoji.name === '3️⃣') {
								columnChoice = 2;
								await playerMove(rowChoice!, columnChoice, user, embed);
							}
							// Row A
							if (reaction.emoji.name === '🇦') {
								rowChoice = 0;
								await playerMove(rowChoice, columnChoice!, user, embed);
							}
							// Row B
							if (reaction.emoji.name === '🇧') {
								rowChoice = 1;
								await playerMove(rowChoice, columnChoice!, user, embed);
							}
							// Row C
							if (reaction.emoji.name === '🇨') {
								rowChoice = 2;
								await playerMove(rowChoice, columnChoice!, user, embed);
							}

							await message.edit({
								embeds: [embed]
							});
						}
					);

					gameCollector.on('end', async () => {
						playerMap.forEach(player => playersInGame.delete(player.id));
						return await message.reactions
							.removeAll()
							.catch((error: string) => Logger.error(`Tic-Tac-Toe - ` + error));
					});
				});

			async function createBoard() {
				// Set asset sizes
				const boardHeight = 700;
				const boardWidth = 700;
				const pieceSize = 150;

				// Set Image size
				const canvas = createCanvas(boardWidth, boardHeight);
				const ctx = canvas.getContext('2d');

				// Get Center to Center measurements for grid spacing
				const positionX = 200;
				const positionY = 200;

				// Tic-Tac-Toe Board
				ctx.fillStyle = 'black';
				ctx.fillRect(0, 0, boardWidth, boardHeight);

				ctx.font = '100px Arial';
				ctx.fillStyle = 'grey';
				// Add Shadows to indicators and empty spaces
				ctx.shadowColor = 'white';
				ctx.shadowBlur = 5;
				ctx.shadowOffsetX = 4;
				ctx.shadowOffsetY = 2;
				// Column Numbers
				ctx.fillText('1', 40, 650);
				ctx.fillText('2', 250, 650);
				ctx.fillText('3', 450, 650);
				// Row Letters
				ctx.fillText('A', 575, 110);
				ctx.fillText('B', 575, 310);
				ctx.fillText('C', 575, 510);

				// Build the Game Board
				for (let columnIndex = 0; columnIndex < 3; ++columnIndex) {
					for (let rowIndex = 0; rowIndex < 3; ++rowIndex) {
						ctx.beginPath();

						// Empty Spaces
						if (gameBoard[rowIndex][columnIndex] === 0) {
							ctx.fillStyle = 'grey';
							ctx.fillRect(
								positionX * columnIndex,
								positionY * rowIndex,
								pieceSize,
								pieceSize
							);
						}

						// Player 1 Pieces
						if (gameBoard[rowIndex][columnIndex] === 1) {
							if (player1Piece) {
								ctx.drawImage(
									player1Piece,
									positionX * columnIndex,
									positionY * rowIndex,
									pieceSize,
									pieceSize
								);
							} else {
								ctx.fillStyle = 'red';
								ctx.shadowColor = 'grey';
								ctx.shadowBlur = 5;
								ctx.shadowOffsetX = 4;
								ctx.shadowOffsetY = 2;
								ctx.fillRect(
									positionX * columnIndex,
									positionY * rowIndex,
									pieceSize,
									pieceSize
								);
							}
						}
						// Player 2 Pieces
						if (gameBoard[rowIndex][columnIndex] === 2) {
							if (player2Piece) {
								ctx.drawImage(
									player2Piece,
									positionX * columnIndex,
									positionY * rowIndex,
									pieceSize,
									pieceSize
								);
							} else {
								ctx.fillStyle = 'blue';
								ctx.shadowColor = 'grey';
								ctx.shadowBlur = 5;
								ctx.shadowOffsetX = 4;
								ctx.shadowOffsetY = 2;
								ctx.fillRect(
									positionX * columnIndex,
									positionY * rowIndex,
									pieceSize,
									pieceSize
								);
							}
						}
					}
				}

				return await interaction.channel
					?.send({
						files: [
							new AttachmentBuilder(canvas.toBuffer('image/png'), {
								name: `TicTacToe-${player1.id}-${player2.id}${currentTurn}.png`
							})
						]
					})

					.then(async (result: Message) => {
						boardImageURL = await result.attachments.entries().next().value[1]
							.url;

						await result.delete();
					})
					.catch((error: string) => {
						Logger.error(`Tic-Tac-Toe - ` + error);
					});
			}
			async function playerMove(
				row: number,
				column: number,
				user: User,
				instance: EmbedBuilder
			) {
				const rowsLetters = ['A', 'B', 'C'];

				if (currentPlayer === user.id) {
					instance.setFields(
						{
							name: 'Column',
							value: `${column !== null ? `${column + 1}` : 'None'}`,
							inline: true
						},
						{
							name: 'Row',
							value: `${row !== null ? rowsLetters[row] : 'None'}`,
							inline: true
						}
					);
				}
				// Wait for both
				if (row === null || column === null) {
					return;
				}

				// Reset 'Column' & 'Row' for next turn
				instance.setFields(
					{ name: 'Column', value: 'None', inline: true },
					{ name: 'Row', value: 'None', inline: true }
				);
				columnChoice = null;
				rowChoice = null;

				if (currentPlayer === 'Game Over' || gameBoard[row][column] !== 0)
					return;

				if (currentPlayer === user.id) {
					if (currentPlayer === player1.id) {
						gameBoard[row][column] = 1;
						currentPlayer = player2.id;
						instance
							.setThumbnail(player2Avatar!)
							.setTitle(`Tic Tac Toe - Player 2's Turn`)
							.setColor(Colors.Blue)
							.setTimestamp();
					} else {
						gameBoard[row][column] = 2;
						currentPlayer = player1.id;
						instance
							.setThumbnail(player1Avatar)
							.setTitle(`Tic Tac Toe - Player 1's Turn`)
							.setColor(Colors.Red)
							.setTimestamp();
					}
					await createBoard();
					++currentTurn;
				}

				if (checkWinner(gameBoard) === 0) {
					// No More Possible Moves
					if (!emptySpaces(gameBoard)) {
						instance
							.setTitle(`Tic Tac Toe - Game Over`)
							.setColor(Colors.Grey)
							.setThumbnail('');
						currentPlayer = 'Game Over';
						playerMap.forEach(player => playersInGame.delete(player.id));
					}
					instance.setImage(boardImageURL!).setTimestamp();
					return;
				} else {
					instance
						.setImage(boardImageURL!)
						.setTitle(
							`Tic Tac Toe - 👑 Player ${checkWinner(gameBoard)} Wins! 👑`
						)
						.setTimestamp();
					if (currentPlayer === player1.id) {
						instance.setThumbnail(player2Avatar!).setColor(Colors.Blue);
					} else {
						instance.setThumbnail(player1Avatar).setColor(Colors.Red);
					}
					currentPlayer = 'Game Over';
					playerMap.forEach(player => playersInGame.delete(player.id));
					return;
				}
			}

			// Check for available spaces
			function emptySpaces(board: number[][]) {
				let result = false;
				for (let columnIndex = 0; columnIndex < 3; ++columnIndex) {
					for (let rowIndex = 0; rowIndex < 3; ++rowIndex) {
						if (board[columnIndex][rowIndex] === 0) {
							result = true;
						}
					}
				}
				return result;
			}

			// Check for Win Conditions
			function checkLine(a: number, b: number, c: number) {
				// Check first cell non-zero and all cells match
				return a != 0 && a == b && a == c;
			}

			function checkWinner(board: number[][]) {
				// Check down
				for (let c = 0; c < 3; c++)
					if (checkLine(board[0][c], board[1][c], board[2][c]))
						return board[0][c];

				// Check right
				for (let r = 0; r < 3; r++)
					if (checkLine(board[r][0], board[r][1], board[r][2]))
						return board[r][0];

				// Check down-right
				if (checkLine(board[0][0], board[1][1], board[2][2]))
					return board[0][0];

				// Check down-left
				if (checkLine(board[0][2], board[1][1], board[2][0]))
					return board[0][2];

				return 0;
			}
		}
		//   });
	}
}
