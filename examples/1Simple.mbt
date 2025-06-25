///|
fn main {
  let name = "World!" // Define a variable
  println("Hello, \{name}") // and use it directly
  println("current count:")
  let buf = @buffer.new()
  for i in 1..<10 { // Loop over a range from 1 to 10
    buf.write_string("\{i} ")
  }
  println(buf)
}
