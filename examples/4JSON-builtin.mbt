///|
fn main {
  let json_example : Json = {
    "array": ["a", "b"],
    "age": 22,
    "name": "John",
    "boolean": true,
  }
  let greeting = match json_example {
    { "age": Number(age), "name": String(name), .. } =>
      "Hello \{name}. You are \{age}"
    _ => "not match"
  }
  greeting |> println
}
