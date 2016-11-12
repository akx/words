var WORDS = OTCWL2;

var SCRABBLE_LETTER_SCORES = {
  'a': 1,
  'b': 3,
  'c': 3,
  'd': 2,
  'e': 1,
  'f': 4,
  'g': 2,
  'h': 4,
  'i': 1,
  'j': 8,
  'k': 5,
  'l': 1,
  'm': 3,
  'n': 1,
  'o': 1,
  'p': 3,
  'q': 10,
  'r': 1,
  's': 1,
  't': 1,
  'u': 1,
  'v': 4,
  'w': 4,
  'x': 8,
  'y': 4,
  'z': 10,
};

var scoreCache = {};

function reverse(s) {
  return s.split('').reverse().join('');
}

function filterWords(ctrl) {
  var letters = ctrl.letters();
  var starts = ctrl.starts();
  var ends = ctrl.ends();
  if (!(letters || starts || ends)) return [];
  var regexpBits = [];
  var availableLetterCounts = {};
  if (starts) regexpBits.push('^' + starts);
  if (letters) {

    [].slice.call(letters).forEach(function (letter) {
      availableLetterCounts[letter] = (0 | availableLetterCounts[letter]) + 1;
    });
    regexpBits.push('[' + Object.keys(availableLetterCounts).join('') + ']+');
  }

  if (ends) regexpBits.push(ends + '$');
  var matchRe = new RegExp(regexpBits.join(''));

  return WORDS.filter(function (word) {
    if (!matchRe.test(word)) return false;
    var body = word.substr(starts ? starts.length : 0);
    body = body.substr(0, body.length - (ends ? ends.length : 0));
    if (letters) {
      var wordLetterCounts = {};
      for (var i = 0; i < body.length; i++) {
        var letter = body[i];
        wordLetterCounts[letter] = (0 | wordLetterCounts[letter]) + 1;
        if (wordLetterCounts[letter] > (0 | availableLetterCounts[letter])) return false;
      }
    }
    return true;
  });
}

function scoreWord(word, scoring) {
  switch (scoring) {
    case 'a1':
      return _.reduce(word, function (score, letter) {
        return score + letter.charCodeAt(0);
      }, 0);
    case 'scrabble':
      return _.reduce(word, function (score, letter) {
        return score + (SCRABBLE_LETTER_SCORES[letter] || 1);
      }, 0);
    case 'length':
      return word.length;
    default:
      return 0;
  }
}

function sortWords(words, scoring) {
  return _.sortBy(words, function (word) {
    const cacheKey = '' + scoring + ':' + word;
    if (cacheKey in scoreCache) return scoreCache[cacheKey];
    return scoreCache[cacheKey] = scoreWord(word, scoring);
  }).reverse().slice(0, 200);
}

function ctrl() {
  this.letters = m.prop('');
  this.starts = m.prop('');
  this.ends = m.prop('');
  this.scoring = m.prop('scrabble');
}

function labeledInput(label, prop) {
  return m('input', {
    placeholder: label,
    value: prop(),
    onchange: m.withAttr('value', prop),
    oninput: m.withAttr('value', prop),
  });
}

function view(ctrl) {
  var words = sortWords(filterWords(ctrl), ctrl.scoring());
  return m('div',
    m('div.setup', [
      labeledInput('letters available', ctrl.letters),
      labeledInput('starts with', ctrl.starts),
      labeledInput('ends with', ctrl.ends),
      m('select', {
        value: ctrl.scoring(),
        onchange: m.withAttr('value', ctrl.scoring),
      }, [
        m('option', {value: 'scrabble'}, 'Scrabble Scoring'),
        m('option', {value: 'a1'}, 'A1 Scoring'),
        m('option', {value: 'length'}, 'Length Scoring'),
      ]),
    ]),
    m('ul', words.map(function (word) {
      return m('li', {key: word}, word, WORDS.indexOf(reverse(word)) > -1 ? ' *' : '');
    }))
  );
}

m.module(document.getElementById('c'), {controller: ctrl, view: view});
