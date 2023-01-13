function checkLength(s, min, max) {
  if (s.toString().length < min) {
    return false;
  } else if (s.toString().length > max) {
    return false;
  } else {
    return true;
  }
}

function checkEmail(s) {
  let email_regex_pattern = /([a-zA-Z0-9\_\-\.]+)@([a-zA-Z]+).([a-zA-Z]+)/g;
  if (email_regex_pattern.test(s)) {
    return true;
  } else {
    return false;
  }
}

function checkName(s) {
  let name_regex_pattern = /^([a-zA-Z]+)([\s]*([a-zA-Z]+))$/g;
  if (name_regex_pattern.test(s)) {
    return true;
  } else {
    return false;
  }
}

function checkNumber(s) {
  let number_regex_pattern = /^([0-9]+)$/g;
  if (number_regex_pattern.test(s)) {
    return true;
  } else {
    return false;
  }
}

console.log(checkNumber("23498732498"));
