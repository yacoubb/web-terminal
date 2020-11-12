import React, { useState } from 'react'

const TimeExample = (props) => {
    const [selPrompt, setSelPrompt] = useState(undefined)
    const [selItems, setSelItems] = useState(undefined)
    const [selCallback, setSelCallback] = useState(undefined)

    const customCommands = {
        time: {
            fn: (args, { appendHistory, setHistory, setName, setInput, setCursor }) => {
                setSelPrompt('A or B')
                setSelItems(['A', 'B'])
                setSelCallback(() => () => {
                    appendHistory(new Date().toString())
                    setSelPrompt(undefined)
                    setSelItems(undefined)
                    setSelCallback(undefined)
                })
            },
            highlight: 'yellow',
            help: 'prints the current time',
        },
    }

    const temp = React.cloneElement(props.children)
    const newProps = {
        ...props,
        commands: { ...props.commands, ...customCommands },
        inputPromptText: props.inputPromptText ? props.inputPromptText : selPrompt,
        selectionItems: props.selectionItems ? props.selectionItems : selItems,
        selectionCallback: props.selectionCallback ? props.selectionCallback : selCallback,
    }
    delete newProps['children']
    return React.cloneElement(temp, newProps)
}

export default TimeExample
