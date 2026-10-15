/* 临时：读 fig-test 页面的测量结果（用完删） */
'use strict'
const fs = require('fs')
const s = fs.readFileSync(process.env.TEMP + '/figtest.html', 'utf8')
const m = /<pre id="out">([\s\S]*?)<\/pre>/.exec(s)
console.log(m ? m[1] : '没有结果；页面里是否有 out 节点：' + s.includes('id="out"'))
