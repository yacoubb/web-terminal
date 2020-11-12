import React from 'react'
import Terminal from './components/Terminal'
import FileSystem from './modules/FileSystem'
import DiceGame from './modules/DiceGame'
import TimeExample from './modules/TimeExample'

const App = () => {
    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <TimeExample>
                <DiceGame>
                    <FileSystem>
                        <Terminal></Terminal>
                    </FileSystem>
                </DiceGame>
            </TimeExample>
        </div>
    )
}

export default App
