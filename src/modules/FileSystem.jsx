import React, { useState } from 'react'
import Terminal from '../components/Terminal'
const path = require('path')

const FileSystem = (props) => {
    const [files, setFiles] = useState({
        home: { $isDir: true, README: { $content: 'A terminal emulator written in react!' } },
        root: { $isDir: true },
        $isDir: true,
    })
    const [dir, setDir] = useState('/')

    const get = (path) => {
        const subdirs = path.split('/').filter((subdir) => subdir.length > 0)
        let finalDir = files
        while (subdirs.length > 0) {
            finalDir = finalDir[subdirs.shift()]
        }
        return finalDir
    }

    const exists = (path) => {
        try {
            return get(path) !== undefined
        } catch {
            return false
        }
    }

    const isDir = (path) => {
        if (exists(path)) {
            return get(path).$isDir
        } else {
            return false
        }
    }

    const commands = {
        cd: {
            fn: ([targetDir, ...rest], { appendError }) => {
                if (targetDir === undefined || targetDir === null || targetDir.length === 0) {
                    return
                }
                let newDir = ''
                if (targetDir.startsWith('/')) {
                    newDir = targetDir
                } else {
                    newDir = path.join(dir, targetDir)
                }
                if (!exists(newDir)) {
                    appendError(`directory ${newDir} doesn't exist`)
                    return
                }
                if (!isDir(newDir)) {
                    appendError(`${newDir} is not a directory`)
                    return
                }
                setDir(newDir)
            },
            highlight: 'blue',
            help: 'enter a directory using its relative path. usage: cd [relpath]',
            autocomplete: () => {
                const dirs = Object.keys(get(dir))
                    .filter((file) => !file.startsWith('$isDir'))
                    .filter((candidate) => {
                        const candidatePath = path.join(dir, candidate)
                        return get(candidatePath).$isDir
                    })
                return dirs
            },
        },
        ls: {
            fn: (args, { appendHistory, appendError }) => {
                let targetDir = dir
                if (args.length !== 0 && args[0].length !== 0) {
                    targetDir = args[0]
                }
                if (!exists(targetDir)) {
                    appendError(`directory ${targetDir} does not exist`)
                    return
                }
                if (!isDir(targetDir)) {
                    appendError(`${targetDir} is not a directory`)
                    return
                }
                const dirs = Object.keys(get(targetDir)).filter((file) => !file.startsWith('$isDir'))
                if (dirs.length > 0) {
                    appendHistory(dirs.join(' '))
                }
            },
            highlight: 'blue',
            help: 'lists files/folders in the current directory',
        },
        pwd: {
            fn: (args, { appendHistory }) => {
                appendHistory(dir)
            },
            highlight: 'blue',
            help: 'prints the path of the current working directory',
        },
        mkdir: {
            fn: ([relPath, ...rest], { appendError }) => {
                if (relPath === undefined || relPath === null || relPath.length === 0) {
                    appendError(`directory name cannot be empty`)
                    return
                }
                const newDir = path.join(dir, relPath)
                const parentDir = path.join(newDir, '..')
                if (exists(newDir)) {
                    appendError(`directory ${newDir} already exists`)
                    return
                }
                if (!exists(parentDir)) {
                    appendError(`parent directory ${parentDir} doesn't exist`)
                    return
                }
                var parentDirObject = get(parentDir)
                parentDirObject[relPath.split('/').pop()] = { $isDir: true }
                setFiles({ ...files })
            },
            highlight: 'blue',
            help: 'create a folder. usage: mkdir [folder name]',
        },
        touch: {
            fn: ([relPath, ...rest], { appendError }) => {
                if (relPath === undefined || relPath === null || relPath.length === 0) {
                    return
                }
                const newDir = path.join(dir, relPath)
                const parentDir = path.join(newDir, '..')
                if (exists(newDir)) {
                    appendError(`file ${newDir} already exists`)
                    return
                }
                if (!exists(parentDir)) {
                    appendError(`parent directory ${parentDir} doesn't exist`)
                    return
                }
                var parentDirObject = get(parentDir)
                parentDirObject[relPath.split('/').pop()] = { $content: '' }
                setFiles({ ...files })
            },
            highlight: 'blue',
            help: 'create an empty file. usage: touch [file name]',
        },
        rm: {},
        cat: {
            fn: ([name, ...rest], { appendError, appendHistory }) => {
                if (name === undefined || name === null || name.length === 0) {
                    return
                }
                const newDir = path.join(dir, name)
                if (!exists(newDir)) {
                    appendError(`file ${newDir} doesn't exist exists`)
                    return
                }
                if (isDir(newDir)) {
                    appendError(`${newDir} is a directory`)
                    return
                }
                const { $content } = get(newDir)
                appendHistory($content)
            },
            highlight: 'blue',
            help: 'prints the contents of a file. usage: cat [file path]',
            autocomplete: () => {
                const files = Object.keys(get(dir))
                    .filter((file) => !file.startsWith('$isDir'))
                    .filter((candidate) => {
                        const candidatePath = path.join(dir, candidate)
                        return get(candidatePath).$isDir === undefined
                    })
                return files
            },
        },
        echo: {
            fn: (args, { appendHistory, appendError }) => {
                if (args.indexOf('>') === -1 && args.indexOf('>>') === -1) {
                    appendHistory(args.join(' '))
                    return
                }
                if (args.indexOf('>') !== -1 && args.indexOf('>>') !== -1) {
                    appendError('bad use of redirects')
                    return
                }
                const redirectIndex = Math.max(args.indexOf('>'), args.indexOf('>>'))
                const filePath = args[redirectIndex + 1]
                if (filePath === undefined || filePath === null || filePath.length === 0) {
                    appendError('filename cannot be empty')
                    return
                }
                if (!exists(filePath)) {
                    commands.touch.fn([filePath], { appendError })
                }
                if (isDir(filePath)) {
                    appendError(`${filePath} is a directory`)
                    return
                }
                console.log(`adding ${args.slice(0, redirectIndex).join(' ')} to file at ${filePath}`)
                console.log(get(filePath))
                get(filePath).$content =
                    (args[redirectIndex] === '>' ? '' : get(filePath).$content) + args.slice(0, redirectIndex).join(' ')
                setFiles({ ...files })
            },
            highlight: 'blue',
            help: 'echos an input to the console. redirect to files with > and >>. usage: echo [message]',
        },
    }

    const temp = React.cloneElement(props.children)
    const newProps = {
        ...props,
        commands: { ...props.commands, ...commands },
    }
    delete newProps['children']
    return React.cloneElement(temp, newProps)

    return <Terminal {...props} commands={{ ...props.commands, ...commands }}></Terminal>
}

export default FileSystem
