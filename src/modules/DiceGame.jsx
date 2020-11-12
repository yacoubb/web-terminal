import React from 'react'
import Terminal, { useTerminalInput, useTerminalSelection } from './Terminal'

const DiceGame = (props) => {
    const [getPromptedInput, inputPrompt, inputCallback] = useTerminalInput()
    const [getChoice, selectionPrompt, selection, selectionCallback] = useTerminalSelection()

    const defaultDicegameCommand = {
        spawn: true,
        name: 'diceGame',
        fn: (args, { appendHistory, appendError }) => {
            appendHistory('diceGame started')
            const config = require('../dicegame/config-template.json')
            if (args.length > 0) {
                config['serverAddress'] = args[0]
            }
            if (args.length > 1) {
                config['port'] = args[1]
            }
            const client = require('../dicegame/dice-client')(config)
            client.setLogger(appendHistory, appendError)
            return client
        },
        commands: (client, { appendHistory, appendError }) => {
            const diceGameCommands = {}
            const { table } = require('../dicegame/logging')(appendHistory, appendError)
            Object.keys(client.commands).forEach((diceGameCommand) => {
                diceGameCommands[diceGameCommand] = {
                    fn: async (args) => {
                        let data = await client.commands[diceGameCommand].fn(...args).catch(client.logErrorCode)
                        if (data !== undefined) {
                            switch (diceGameCommand) {
                                case 'players':
                                    appendHistory(`${client.chalk.red('[server]')} players in room: ${JSON.stringify(Object.values(data))}`)
                                    break
                                case 'roomInfo':
                                    appendHistory(`${client.chalk.red('[server]')} room info:`)
                                    appendHistory(table(data, 'property', 'value').join('\n'))
                                    break

                                default:
                                    appendHistory(
                                        `${client.chalk.red('[server]')} ${typeof data === 'string' ? data : JSON.stringify(data)}`,
                                    )
                                    break
                            }
                        }
                    },
                    highlight: client.commands[diceGameCommand].highlight,
                    help: client.commands[diceGameCommand].help,
                }
            })

            client.callbacks.registerPasswordCallback(() => {
                return getPromptedInput('enter room password...')
            })

            client.callbacks.registerRoomInfoCallback(() => {
                return new Promise(async (resolve) => {
                    const roomInfo = {
                        name: await getPromptedInput('enter room name...'),
                        public: (await getChoice('room visibility...', ['public', 'private'])) === 0,
                        password: await getPromptedInput('enter room password (leave blank for no password)'),
                        maxPlayers: Math.max(1, parseInt(await getPromptedInput('enter max players (minimum 1)'))),
                    }
                    console.log(roomInfo)
                    resolve(roomInfo)
                })
            })

            return diceGameCommands
        },
        quit: (client) => {
            client.socket.disconnect()
            client.socket.close()
        },
        highlight: 'yellow',
        help: 'plays the dicegame! optionally pass server address and port: diceGame [address] [port]',
    }

    const temp = React.cloneElement(props.children)
    const newProps = {
        ...props,
        commands: { ...props.commands, diceGame: defaultDicegameCommand },
        inputPromptText: props.inputPromptText ? props.inputPromptText : inputPrompt ? inputPrompt : selectionPrompt,
        inputPromptCallback: props.inputPromptCallback ? props.inputPromptCallback : inputCallback,
        selectionItems: props.selectionItems ? props.selectionItems : selection,
        selectionCallback: props.selectionCallback ? props.selectionCallback : selectionCallback,
    }
    delete newProps['children']
    return React.cloneElement(temp, newProps)

    return (
        <Terminal
            commands={{ diceGame: defaultDicegameCommand }}
            inputPromptText={inputPrompt ? inputPrompt : selectionPrompt}
            inputPromptCallback={inputCallback}
            selectionItems={selection}
            selectionCallback={selectionCallback}
        ></Terminal>
    )
}

export default DiceGame
