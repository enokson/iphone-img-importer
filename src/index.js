#!/usr/bin/env node

const fs = require('fs').promises
const path = require('path')
const exec = (cmd, args) => {
    // console.log(`Converting ${args[0]} => ${args[1]}`)
    return new Promise((resolve, reject) => {
        require('child_process').exec(`${cmd} ${args.join(' ')}`, { cwd: process.cwd() }, (error, _stout, _sterr) => {
            if (error) {
                // console.error(`${args[0]} => ${args[1]}. error.`)
            } else {
                // console.log(`${args[0]} => ${args[1]}. done.`)
            }
            return resolve()
        })
    })
}
const convertFile = obj => exec('heif-convert', [ obj.base, `${obj.name}.jpg` ]).then(() => obj)
const isEdited = obj => obj.name.includes('E')
const isHEIC = obj => obj.ext === '.HEIC'
const isAAE = obj => obj.ext === '.AAE'
const getImgId = arr => arr.map(obj => Object.assign(obj, { id: obj.name.split('E')[1] }))
const getEditedFiles = arr => arr.filter(isEdited)
const toMetaObj = arr => arr.map(path.parse)
const getOriginal = src => arr => arr.map(obj => {
    for (const orginal of src) {
        if (orginal.includes(`IMG_${obj.id}`)) {
            obj.original = orginal
        }
    }
    return obj
})
const organize = arr => Promise.all(arr.map(async obj => {
    // console.log('Removing copy %s', obj.original)
    return Promise.all([
        fs.unlink(obj.original),
        fs.rename(obj.base, `IMG_${obj.id}${obj.ext}`)
    ])
}))
const convert = arr => Promise.all(arr.map(async obj => isHEIC(obj) ? convertFile(obj) : Promise.resolve(obj)))
const rm = arr => Promise.all(arr.map(async obj => isAAE(obj) || isHEIC(obj) ? fs.unlink(obj.base).then(obj) : Promise.resolve(obj)))
async function main () {
    try {
        let dirEntries = await fs.readdir(process.cwd())
        const getOriginalsFromDirEntries = getOriginal(dirEntries)
        await organize(getOriginalsFromDirEntries(getImgId(getEditedFiles(toMetaObj(dirEntries)))))
        dirEntries = await fs.readdir(process.cwd())
        await rm(await convert(toMetaObj(dirEntries)))
    } catch (_error) {
        // console.log(error)
    }    
}
main()
