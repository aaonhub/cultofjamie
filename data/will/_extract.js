const data4 = require('./general_page_4.json');
const data5 = require('./general_page_5.json');

const keywords = [
  'belief','believe','fact','knowledge','self-image','sensory','perception',
  'perceive','past','future','reality','real','emotion','happiness','happy',
  'anger','angry','love','good','bad','observation','observe',
  'interpretation','interpret','guilt','shame','annoyance','annoyed',
  'frustration','frustrated','time','intelligence','intelligent',
  'self-realization','ego','loneliness','lonely','grief','ambition',
  'discontent','thought','think','mind','consciousness','aware','awareness',
  'truth','suffering','fear','desire','meaning','purpose','identity',
  'freedom','attachment','illusion','experience','exist','existence',
  'soul','spirit','enlighten','wisdom','understanding','judgment',
  'opinion','perspective','subjective','objective'
];

function isWill(m) {
  const gn = (m.author && m.author.global_name || '').toLowerCase();
  const un = (m.author && m.author.username || '').toLowerCase();
  return gn === 'will' || un === 'tsnnoy';
}

function isSub(m) {
  if (!m.content || m.content.length < 50) return false;
  const l = m.content.toLowerCase();
  return keywords.some(k => l.includes(k));
}

const s4 = data4.filter(m => isWill(m) && isSub(m));
const s5 = data5.filter(m => isWill(m) && isSub(m));

console.log('=== PAGE 4 SUBSTANTIVE MESSAGES (' + s4.length + ') ===\n');
s4.forEach((m, i) => {
  console.log('--- P4 MSG #' + (i+1) + ' [' + m.timestamp + '] ---');
  console.log(m.content);
  console.log('');
});

console.log('\n=== PAGE 5 SUBSTANTIVE MESSAGES (' + s5.length + ') ===\n');
s5.forEach((m, i) => {
  console.log('--- P5 MSG #' + (i+1) + ' [' + m.timestamp + '] ---');
  console.log(m.content);
  console.log('');
});
