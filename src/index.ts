import { ConcatSource } from 'webpack-sources'
import { Compiler, compilation } from 'webpack'
import { template } from 'lodash'
import * as path from 'path'
import AbstractPlugin from "./abstractPlugin"
import logger from './logger'
import Server from './server'
import requireFromPath from './requireFromPath'
import  * as clientCode from 'raw-loader!./client.ts'
import { pathsInPaths } from './utils/pathComp'
import CONSTANT from './constant'

const pluginTapName = 'crx-Reload'
export = class ReloadPlugin extends AbstractPlugin{
	private manifest: Manifest
	private manifestPath: string
	private port: number
	private paths: ListenPaths
	private server: Server
	constructor({manifest, port, paths}: Options){
		super()
		this.manifestPath = manifest
		this.paths = paths || {}
		this.port = port || 9999
		this.server = new Server()
		this.server.launch()
	}
	getManifest(){
		this.manifest = requireFromPath(this.manifestPath)
		logger.info(`get manifest.js content`)
	}
	checkPath(context: string){
		this.paths.background = this.paths.background || [path.resolve(context, 'background/')]
		this.paths.options = this.paths.options || [path.resolve(context, 'options/')]
		this.paths.popup = this.paths.popup || [path.resolve(context, 'popup/')]
		this.paths.content = this.paths.content || [path.resolve(context, 'content/')]
	}
	injectCode(compilation: compilation.Compilation, chunks: compilation.Chunk[]){
		let background = this.manifest.background.scripts
		let injectChunk: compilation.Chunk
		chunks.forEach(chunk => {
			if (chunk.files.includes(background[0])) {
				injectChunk = chunk
				logger.info(`inject in ${chunk.name} chunk`)
			}
		})
		if (injectChunk) {
			let client = template(clientCode)({
				arg: 'lalala'
			})
			compilation.assets[background[0]] = new ConcatSource(client, compilation.assets[background[0]])
		}
		
	}
	generateMainifest(compilation: compilation.Compilation){
		compilation.fileDependencies.add(this.manifestPath)
		let manifestJSON = JSON.stringify(this.manifest)
		compilation.assets['manifest.json'] = {
			source: () => manifestJSON,
			size: () => manifestJSON.length
		}
	}
	noticeClient(compilation: compilation.Compilation){
		let complier = compilation.compiler
		// @ts-ignore: Unreachable code error // fix @types/webpack watchFileSystem undeclare error
		let changed = Object.keys(complier.watchFileSystem.watcher.mtimes)
		/* judge the diff files, then send to chrome client to reload, have 3 situation
		1. manifest.js file was changed, need reload the extension
		2. options.html file was changed, need reload the options tab
		3. content script file was changed, may be need reload all tab
		4. background.js file was changed, need reload background.html
		*/
		let diff = this.judgeDiff(changed)
		logger.info(`file change result: ${diff}`)
		this.server.send(diff)
	}
	judgeDiff(changed: Array<string>): Array<string>{
		if (changed.length === 0) {
			return []
		}
		// TODO split path to judge reload scope
		let changedFile = changed
		let inBackgroundPaths = pathsInPaths(changedFile, this.paths.background) // 2
		let inPopupPaths = pathsInPaths(changedFile, this.paths.popup) // 3
		let inContentPaths = pathsInPaths(changedFile, this.paths.content) // 4
		let inOptionsPaths = pathsInPaths(changedFile, this.paths.options) //5
		let res: Array<string> = []
		if (inBackgroundPaths) {
			res.push(CONSTANT.DIFF_CODE[2])
		}
		if (inPopupPaths) {
			res.push(CONSTANT.DIFF_CODE[3])
		}
		if (inContentPaths) {
			res.push(CONSTANT.DIFF_CODE[4])
		}
		if (inOptionsPaths) {
			res.push(CONSTANT.DIFF_CODE[5])
		}
		return res
	}
	apply(complier: Compiler){
		complier.hooks.watchRun.tap(pluginTapName, complier => {
			// @ts-ignore: Unreachable code error // fix @types/webpack context undeclare error
			this.checkPath(complier.context)
			this.getManifest()
		})
		complier.hooks.compilation.tap(pluginTapName, compilation => {
			compilation.hooks.afterOptimizeChunkAssets.tap(pluginTapName, chunks => {
				this.injectCode(compilation, chunks)
			})
		})
		complier.hooks.emit.tap(pluginTapName, compilation => {
			this.generateMainifest(compilation)
		})
		complier.hooks.afterEmit.tap(pluginTapName, compilation => {
			this.noticeClient(compilation)
			compilation
		})
	}
}
