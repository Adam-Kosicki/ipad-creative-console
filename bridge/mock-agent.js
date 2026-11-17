// Fake PhoneBox agent on :8765 so the bridge can be tested without PhoneBox.
var http=require('http'),items=[{id:'ab12cd34ef56',tool:'Bash',project:'demo',detail:'rm -rf build/',createdAt:Date.now(),expiresAt:Date.now()+60000}];
http.createServer(function(q,r){var u=require('url').parse(q.url,true),m;r.setHeader('Content-Type','application/json');
 if(u.pathname==='/api/state')return r.end('{}');
 // four pages, so page switching (swipe, lite tabs) can be tried
 if(u.pathname==='/api/config'){var st=function(m,x){return{id:m,type:'stat',x:x,y:4,w:3,h:2,options:{metric:m}}};return r.end(JSON.stringify({version:1,config:{pages:[
  {id:'home',title:'Home',icon:'\u{1F3E0}',widgets:[{id:'clock',type:'clock',x:0,y:0,w:6,h:4,options:{}},{id:'media',type:'media',x:6,y:0,w:6,h:4,options:{}},st('cpu',0),st('gpu',3),st('ram',6),st('net',9)]},
  {id:'claude',title:'Claude',icon:'\u2733',widgets:[{id:'q',type:'quotas',x:0,y:0,w:12,h:6,options:{}}]},
  {id:'sys',title:'System',icon:'\u{1F5A5}',widgets:[st('cpu',0),st('gpu',3),st('ram',6),st('net',9)]},
  {id:'clock2',title:'Clock',icon:'\u23F0',widgets:[{id:'c2',type:'clock',x:0,y:0,w:12,h:6,options:{}}]}]}}))}
 if(u.pathname==='/api/approvals'&&q.method==='GET')return r.end(JSON.stringify({items:items}));
 if(m=/^\/api\/approvals\/(\w+)$/.exec(u.pathname)){items=items.filter(function(a){return a.id!==m[1]});console.log('decision',m[1],u.query.decision);return r.end('{}')}
 if(u.pathname==='/api/quotas')return r.end(JSON.stringify({providers:[{id:'claude',name:'Claude',plan:'Max',limits:[{label:'5h',percent:42},{label:'Week',percent:78}]}]}));
 r.statusCode=404;r.end('{}')}).listen(8765,'127.0.0.1');
