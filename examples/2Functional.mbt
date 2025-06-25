///|
enum Resource {
  Text(String)
  CSV(content~ : String)
  Executable
}

///|
let resources : Map[String, Resource] = {
  "hello.txt": Text("Hello, world! A long text."),
  "test.csv": CSV(content="name, age\nAlice, 25\nBob, 30"),
  "ls.exe": Executable,
}

///|
fn main {
  resources
  .iter()
  .filter_map(res => match res {
    (name, Text(str)) | (name, CSV(content=str)) => Some((name, str))
    (_, Executable) => None
  })
  .map(res => {
    let (name, content) = res
    let name = name.pad_start(10, ' ')
    let content = content
      .pad_end(10, ' ')
      .replace_all(old="\n", new=" ")
      .substring(start=0, end=10)
    "\{name}: \{content} ..."
  })
  .intersperse("\n")
  .fold(init="Summary:\n", String::op_add)
  |> println
}
