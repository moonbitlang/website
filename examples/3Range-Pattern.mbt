///|
const Zero = 0

///|
fn sign(x : Int) -> Int {
  match x {
    _..<Zero => -1
    Zero => 0
    Zero..<_ => 1
  }
}

///|
fn classify_char(c : Char) -> String {
  match c {
    'a'..='z' => "lowercase"
    'A'..='Z' => "uppercase"
    '0'..='9' => "digit"
    _ => "other"
  }
}

///|
fn main {
  sign(20) |> println
  classify_char('X') |> println
}
