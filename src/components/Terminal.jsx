import React, { useState, useMemo } from 'react';
import useKeypress from 'react-use-keypress';
import './Terminal.css';

import { hyperColors } from './HyperTheme';
import { defaultName, linePrompt } from './TerminalConfig';
import { useEffect } from 'react';
const stripAnsi = require('strip-ansi');
const chalk = require('chalk');
const chalkCtx = new chalk.Instance({ level: 2 });
const ansiHTML = require('ansi-html');
const formattedColors = { ...hyperColors.colors };
Object.keys(formattedColors).forEach((color) => (formattedColors[color] = formattedColors[color].replace('#', '')));
ansiHTML.setColors(formattedColors);

const Terminal = ({ commands: propCommands, overrideCommands, selectionItems, selectionCallback, inputPromptText, inputPromptCallback }) => {
	const [name, setName] = useState(defaultName);
	const [history, setHistory] = useState([]);
	const [commandHistory, setCommandHistory] = useState([]);
	const [input, setInput] = useState(``);
	const [cursor, setCursor] = useState(0);
	const [selectionIndex, setSelectionIndex] = useState(0);

	const htmlToDiv = (html, style) => <div style={style} dangerouslySetInnerHTML={{ __html: ansiHTML(html) }}></div>;
	const promptWidth = useMemo(() => `${(stripAnsi(linePrompt(name)).length + 1) * 9.609}px`, [name]);
	const prompt = useMemo(() => htmlToDiv(linePrompt(name), { width: promptWidth, display: 'inline-block' }), [promptWidth, name]);

	const appendHistory = (line) => {
		setHistory((history) => history.concat([line]));
	};

	const appendError = (msg) => {
		setHistory((history) => history.concat([`${chalkCtx.red.bold('err')} ${msg}`]));
	};

	useEffect(() => {
		if (inputPromptText !== undefined && inputPromptText !== null && inputPromptText.length > 0) {
			appendHistory(inputPromptText);
		}
	}, [inputPromptText]);

	const colorLine = (line) => {
		if (line !== undefined && line !== null) {
			if (typeof line !== 'string') {
				line = JSON.stringify(line);
			}
			return (
				<>
					{line.split('\n').map((subLine, i) => (
						<div key={i} id={subLine}>
							<div dangerouslySetInnerHTML={{ __html: ansiHTML(subLine) }} style={{ display: 'inline-block', whiteSpace: 'pre-wrap' }}></div>
							<br></br>
						</div>
					))}
				</>
			);
		}
	};

	const cursorHighlightStyle = { backgroundColor: hyperColors.cursorColor, color: hyperColors.borderColor };
	const [commands, setCommands] = useState({
		help: {
			fn: (args, { appendHistory, setHistory, setName, setInput, setCursor }) => {
				const result = Object.keys(commands)
					.sort()
					.map((command) => `${command}: ${commands[command].help}`)
					.join('\n');
				appendHistory(result);
			},
			highlight: 'blue',
			help: 'displays this prompt',
		},
		clear: {
			fn: (args, { appendHistory, setHistory, setName, setInput, setCursor }) => {
				setHistory([]);
			},
			highlight: 'red',
			help: 'clears the terminal',
		},
		setName: {
			fn: (args, { appendHistory, setHistory, setName, setInput, setCursor }) => {
				const name = args[0];
				if (name === undefined || name.length === 0) {
					appendHistory(`${chalkCtx.red.bold('err')} - username cannot be empty`);
				} else if (args.length > 1) {
					appendHistory(`${chalkCtx.red.bold('err')} - username cannot contain spaces`);
				} else if (name.length > 20) {
					appendHistory(`${chalkCtx.red.bold('err')} - username must be less than 20 characters long`);
				} else {
					appendHistory(`${chalkCtx.green.bold('success')} - username set to ${name}`);
					setName(name);
				}
			},
			highlight: 'blue',
			help: 'set your username. usage: setName [username]',
		},
		...propCommands,
	});

	const inputElem = () => {
		let i = -1;
		return (
			<>
				{prompt}
				{input.split(/([\s\n])/g).map((word, wordIndex) => (
					<span key={wordIndex} style={{ color: commands[word] ? hyperColors.colors[commands[word].highlight] : undefined }}>
						{word.split('').map((char) => {
							i++;
							return (
								<span key={i} style={i === cursor ? cursorHighlightStyle : undefined}>
									{char}
								</span>
							);
						})}
					</span>
				))}
				<span style={input.length === cursor ? cursorHighlightStyle : undefined}>‎ </span>
			</>
		);
	};

	const selectionElem = () => {
		return (
			<>
				{selectionItems.map((item, index) => (
					<div key={index} style={{ color: index === selectionIndex ? hyperColors.colors['cyan'] : undefined }}>
						<div style={{ display: 'inline-block' }}>{index === selectionIndex && '>'}</div>
						<span>
							{'  '}
							{index !== selectionIndex && ' '}
						</span>
						<span>{item}</span>
					</div>
				))}
			</>
		);
	};

	useKeypress('ArrowRight', () => {
		setCursor(Math.min(input.length, cursor + 1));
	});

	useKeypress('ArrowLeft', () => {
		setCursor(Math.max(0, cursor - 1));
	});

	const [lastCommandCursor, setLastCommandCursor] = useState(0);

	useKeypress('ArrowUp', () => {
		if (selectionItems) {
			setSelectionIndex((selectionIndex) => (selectionIndex - 1 + selectionItems.length) % selectionItems.length);
			return;
		}
		let updatedCursor = Math.min(lastCommandCursor + 1, commandHistory.length);
		if (updatedCursor > 0) {
			const loadedCommand = commandHistory[commandHistory.length - updatedCursor];
			setInput(loadedCommand);
			setCursor(loadedCommand.length);
		} else {
			setInput('');
			setCursor(0);
		}
		setLastCommandCursor(updatedCursor);
	});

	useKeypress('ArrowDown', () => {
		if (selectionItems) {
			setSelectionIndex((selectionIndex) => (selectionIndex + 1 + selectionItems.length) % selectionItems.length);
			return;
		}
		let updatedCursor = Math.max(0, lastCommandCursor - 1);
		if (updatedCursor > 0) {
			const loadedCommand = commandHistory[commandHistory.length - updatedCursor];
			setInput(loadedCommand);
			setCursor(loadedCommand.length);
		} else {
			setInput('');
			setCursor(0);
		}
		setLastCommandCursor(updatedCursor);
	});

	// TODO: make alphabet modular and have extensions append stuff to alphabet
	'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-,./>'.split('').forEach((key) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		useKeypress(key, () => {
			setInput(input.slice(0, cursor) + key + input.slice(cursor));
			setCursor(cursor + 1);
		});
	});

	useKeypress(' ', () => {
		setInput(input.slice(0, cursor) + ' ' + input.slice(cursor));
		setCursor(cursor + 1);
	});

	useKeypress('Backspace', (e) => {
		if (cursor > 0) {
			// TODO: someday add logic for alt-deletion
			setInput(input.slice(0, cursor - 1) + input.slice(cursor));
			setCursor(cursor - 1);
		}
	});

	const commandToLine = (command) => {
		return (
			linePrompt(name) +
			' ' +
			command
				.split(' ')
				.map((word) => (word in commands ? chalkCtx`{${commands[word].highlight} ${word}}` : word))
				.join(' ')
		);
	};

	const exec = () => {
		// executes input as if it were a command (i.e. not a prompt or selection item)
		const coloredInput = commandToLine(input);

		appendHistory(coloredInput);
		setCommandHistory(commandHistory.concat([input]));
		setLastCommandCursor(0);
		setInput('');
		setCursor(0);

		const [command, ...args] = input.split(' ');
		if (command in commands) {
			if (commands[command].spawn) {
				spawn(command, args);
			} else {
				commands[command].fn(args, { appendHistory, appendError, setHistory, setName, setInput, setCursor });
			}
		} else if (command !== undefined && command.length > 0) {
			appendHistory(`${chalkCtx.red.bold('err')} - unknown command ${command}`);
		}
	};

	const spawn = (command, args) => {
		console.log(`spawn ${command} ${args}`);
		// should spawn a new process
		// save the current process for later restoration
		const currentContext = { name, history: [...history, commandToLine(command)], commandHistory: [...commandHistory, command], commands: { ...commands } };
		// update with new command's context
		const ranCommand = commands[command];
		setName(ranCommand.name);
		setHistory([]);
		setCommandHistory([]);
		setInput('');
		setCursor(0);
		setLastCommandCursor(0);
		setSelectionIndex(0);

		const context = ranCommand.fn(args, { appendHistory, appendError, setHistory, setName, setInput, setCursor });

		const contextCommands = ranCommand.commands(context, { appendHistory, appendError, setHistory, setName, setInput, setCursor });

		const newCommands = {
			...contextCommands,
			quit: {
				fn: () =>
					quit(() => {
						ranCommand.quit(context);
					}, currentContext),
				help: 'exit the current process',
				highlight: 'red',
			},
			help: {
				fn: (args, { appendHistory }) => {
					appendHistory(
						Object.keys(newCommands)
							.sort()
							.map((command) => `${command}: ${newCommands[command].help}`)
							.join('\n'),
					);
				},
				help: 'shows this prompt',
				highlight: 'green',
			},
		};

		setCommands({
			...newCommands,
		}); // each spawn process should have the same quit command
	};

	const quit = (quitCallback, previousContext) => {
		console.log('quit');
		// exit the current process and restore parent process
		console.log(previousContext);
		if (previousContext !== undefined && Object.keys(previousContext).length !== 0) {
			quitCallback();
			setName(previousContext.name);
			setCommands(previousContext.commands);
			setHistory(previousContext.history);
			setCommandHistory(previousContext.commandHistory);
			setInput('');
			setCursor(0);
			setLastCommandCursor(0);
			setSelectionIndex(0);
		}
	};

	useKeypress('Enter', () => {
		if (selectionCallback) {
			appendHistory(chalkCtx.cyan(`>  ${selectionItems[selectionIndex]}`));
			selectionItems = undefined;
			selectionCallback(selectionIndex);
			setSelectionIndex(0);
			return;
		} else if (inputPromptCallback) {
			appendHistory(input);
			inputPromptCallback(input);
			setInput('');
			setCursor(0);
			return;
		}
		exec();
	});

	const autocomplete = (suggestions, printSuggestions) => {
		if (printSuggestions === undefined) {
			printSuggestions = suggestions;
		}
		if (suggestions.length > 0) {
			if (suggestions.length === 1) {
				setInput(suggestions[0] + ' ');
				setCursor(suggestions[0].length + 1);
			} else {
				// find the longest common starting string across suggestions
				let prefix = '';
				while (prefix.length !== suggestions[0].length) {
					let nextPrefix = suggestions[0].slice(0, prefix.length + 1);
					if (suggestions.reduce((acc, suggestion) => acc && suggestion.startsWith(nextPrefix), true)) {
						prefix = nextPrefix;
					} else {
						break;
					}
				}
				if (input !== prefix) {
					setInput(prefix);
					setCursor(prefix.length);
				} else {
					appendHistory(commandToLine(input));
					appendHistory(printSuggestions.join(' '));
				}
			}
		}
	};

	useKeypress('Tab', (e) => {
		e.preventDefault();
		// autocomplete
		if (input && input.length > 0) {
			console.log(input);
			console.log(input.endsWith(' '));
			if (input.split(' ').length === 1 && !input.endsWith(' ')) {
				// command
				const suggestions = Object.keys(commands)
					.sort()
					.filter((command) => command.startsWith(input));
				autocomplete(suggestions);
			} else {
				const [command, ...args] = input.split(' ');
				if (command in commands) {
					if (commands[command].autocomplete !== undefined) {
						const rawSuggestions = commands[command].autocomplete(args);
						const suggestions = rawSuggestions
							.map((sugg) => `${command} ${sugg}`)
							.sort()
							.filter((sugg) => sugg.startsWith(input));
						autocomplete(suggestions, rawSuggestions);
					}
				}
			}
		}
	});

	useEffect(() => {
		const scrollable = document.getElementById('scrollable');
		if (scrollable !== null) {
			scrollable.scrollTop = scrollable.scrollHeight;
		}
	}, [history, input]);

	return (
		<div
			style={{
				backgroundColor: hyperColors.borderColor,
				color: hyperColors.foregroundColor,
				wordBreak: 'break-all',
				width: '100%',
				height: '100%',
			}}
			className="codeFont"
		>
			<div id="scrollable" style={{ padding: '1em', height: 'calc(100% - 2em)', overflowY: 'auto', overflowX: 'hidden' }}>
				<div>
					{history.map((line, i) => (
						<div key={i}>{colorLine(line)} </div>
					))}
				</div>
				<div>{selectionItems ? selectionElem() : inputElem()}</div>
			</div>
		</div>
	);
};

export default Terminal;

export const useTerminalInput = () => {
	const [prompt, setPrompt] = useState(undefined);
	const [promptCallback, setPromptCallback] = useState(undefined);
	return [
		(inputPrompt) =>
			new Promise((resolve) => {
				setPrompt(inputPrompt);
				setPromptCallback(() => (result) => {
					setPromptCallback(undefined);
					setPrompt(undefined);
					resolve(result);
				});
			}),
		prompt,
		promptCallback,
	];
};

export const useTerminalSelection = () => {
	const [prompt, setPrompt] = useState(undefined);
	const [selectionItems, setSelectionItems] = useState(undefined);
	const [selectionCallback, setSelectionCallback] = useState(undefined);
	return [
		(choicePrompt, choices) =>
			new Promise((resolve) => {
				setPrompt(choicePrompt);
				setSelectionItems(choices);
				setSelectionCallback(() => (index) => {
					setPrompt(undefined);
					setSelectionCallback(undefined);
					setSelectionItems(undefined);
					resolve(index);
				});
			}),
		prompt,
		selectionItems,
		selectionCallback,
	];
};
