import { mkdirSync,copyFileSync } from 'node:fs';
for(const route of ['login','institutions','members','suppliers','accounts','entries','entry','balance','journal','backup']){
 mkdirSync(`dist/${route}`,{recursive:true});copyFileSync('dist/index.html',`dist/${route}/index.html`);
}
copyFileSync('dist/index.html','dist/404.html');


