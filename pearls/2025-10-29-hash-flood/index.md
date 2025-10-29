---
slug: hash-flood
author: Rynco Maekawa
description: 'Interacting with JavaScript in MoonBit: A First Look'
image: cover.png
---

# Let's flood a `HashMap`!

![](./cover.png)

> This article gives a brief introduction of the structure of a hash table,
> demonstrates hash flooding attack -- a common attack on it,
> and how to militate it when implementing this data structure.

Everybody loves hashmaps.

They provide a blazing fast average $O(1)$ access<sup>\*</sup> to associate any value to any key,
asking for only two things in return:
an equality comparer and a hash function, nothing more.
This unique property makes hashmaps often more efficient
than other associative data structures like search trees.
As a result, hashmaps are nowadays one of the most used data structures in programming languages.

From the humble `dict` in Python, to databases and distributed systems,
and even JavaScript objects, they're everywhere.
They power database indexing systems, enable efficient caching mechanisms,
and form the backbone of web frameworks for routing requests.
Modern compilers use them for symbol tables, operating systems rely on them for process management,
and virtually every web application uses them to manage user state.

Whether you're building a web server, parsing JSON values,
dealing with configurations, or just counting word frequencies,
chances are you'll reach for a hashmap.
They've become so fundamental that many developers take their $O(1)$ magic for granted --
_but the $1$ in $O(1)$ has got some strings<sup>\*</sup> attached_.

## The anatomy of a hashmap

A hashmap is made of two parts:
a bucket array and a hash function.

```mbt
struct MyHashMap[K, V] {
  buckets : Array[Bucket[K, V]]
  hash_fn : (K) -> UInt
}
```

The **bucket array** contains a list of what we call "buckets".
Each bucket stores some data we have inserted.

The **hash function** `H` associates each key with an integer.
This integer is used to find an index in the bucket array to store our value.
Usually, the index is derived by simply moduloing the integer with the size of the bucket array,
i.e. `index = H(key) % bucket_array_size`.
The hashmap expects the function to satisfy two important properties:

1. The same key is always converted to the same number. i.e., `if a == b, then H(a) == H(b)`.

   This property ensures that,
   once we have found a bucket to insert using a key,
   we can always find the same bucket where it has been inserted,
   using the same key.

2. The resulting number is distributed uniformly across the space of possible results
   for different keys.

   This property ensures that different keys are unlikely to have the same associated integer,
   and in consequence, unlikely to be mapped to the same bucket in the array,
   allowing us to retrieve the value efficiently.

Now, you may ask, what would happen if two keys map to the same bucket?
This comes to the realm of hash collisions.

## Hash collisions

When two keys have the same hash value,
or more broadly, when two keys map to the same bucket,
a hash collision occurs.

As hashmaps determines everything based on the hash value (or bucket index),
the two keys now look the same to the hashmap itself --
they should be put into the same place,
but still unequal enough to not overwriting each other.

Hashmap designers have a couple of strategies to deal with collisions,
which fall into one of the two broad categories:

- The **chaining** method puts these keys in the same bucket.
  Each bucket now may contain the data for a number of keys,
  instead of just one.
  When searching for a colliding key,
  all keys in the bucket are searched at once.

  ```mbt
  struct ChainingBucket[K, V] {
    values : Array[(K, V)]
  }
  ```

  Java's `HashMap` is a popular example of this approach.

- The **open addressing** method still has one key per bucket,
  but uses a separate strategy to choose another bucket index when keys collide.
  When searching for a key, buckets are searched in the order of the strategy
  until the it is obvious that there are no more keys that could match.

  ```mbt
  struct OpenAddressBucket[K, V] {
    hash: Int
    key: K
    value: V
  }
  ```

  MoonBit's standard library `Map` is an example of this approach.

Either case, when a hash collision happens,
we have no choice but to search through everything corresponding to the bucket we've found,
to determine whether the key we are looking for is there or not.

Using a chaining hashmap (for simplicity), the whole operation looks something like this:

```mbt
typealias ChainingBucket as Bucket

/// Search for the place where the key is stored.
///
/// Returns `(bucket, index, number_of_searches_done)`
fn[K : Eq, V] MyHashMap::search(self : MyHashMap[K, V], key : K) -> (Int, Int?, Int) {
  let hash = (self.hash_fn)(key)
  let bucket = (hash % self.buckets.length().reinterpret_as_uint()).reinterpret_as_int()
  // Result
  let mut found_index = None
  let mut n_searches = 0
  // Search through all key-value pairs in the bucket.
  for index, keyvalue in self.buckets[bucket].values {
    n_searches += 1
    if keyvalue.0 == key { // Check if the key matches.
      found_index = Some(index)
      break
    }
  }
  return (bucket, found_index, n_searches)
}

/// Insert a new key-value pair.
///
/// Returns the number of searches done.
fn[K : Eq, V] MyHashMap::insert(self : MyHashMap[K, V], key : K, value : V) -> Int {
  let (bucket, index, n_searches) = self.search(key)
  if index is Some(index) {
    self.buckets[bucket].values[index] = (key, value)
  } else {
    self.buckets[bucket].values.push((key, value))
  }
  n_searches
}
```

This is the string attached to the $O(1)$ access magic --
we'd have to search through everything if we're unlucky.
This gives the hashmap a worst-case complexity of $O(n)$,
where $n$ is the number of keys in the hashmap.

## Crafting a collision

For most hash functions we use for hashmaps, unlucky collisions are rare.
This means that we usually won't need to bother with the worst case scenario
and enjoy the $O(1)$ speed for the vast majority of the time.

That is, unless someone,
~~maybe some black-suited hackerman with some malicious intent,~~
forces you into one.

Hash functions are usually designed to be deterministic and fast,
so even without advanced cryptanalysis of the function itself,
we can still find some keys that will collide with each other by brute force. [^brute-force]

[^brute-force]:
    Side note, this is also similar to how Bitcoin mining works --
    finding a value to add to an existing string,
    so the hash of the entire thing (with bits reversed), modulo some given value, is zero.

```mbt
fn find_collision(
  bucket_count : Int,
  target_bucket : Int,
  n_collision_want : Int,
  hash_fn : (String) -> UInt,
) -> Array[String] {
  let result = []
  let bucket_count = bucket_count.reinterpret_as_uint()
  let target_bucket = target_bucket.reinterpret_as_uint()
  for i = 0; ; i = i + 1 {
    // Generate some string key.
    let s = i.to_string(radix=36)
    // Calculate the hash value
    let hash = hash_fn(s)
    let bucket_index = hash % bucket_count
    let bucket_index = if bucket_index < 0 {
      bucket_index + bucket_count
    } else {
      bucket_index
    }
    // Check if it collides with our target bucket.
    if bucket_index == target_bucket {
      result.push(s)
      if result.length() >= n_collision_want {
        break
      }
    }
  }
  result
}
```

## Hash flooding attack

With colliding values in hand, we (in the role of malicious hackermen)
can now attack hashtables to constantly exploit their worst-case complexity.

Consider the following case: you are inserting keys into the same hashmap,
but every key hashes into the same bucket.
With each insert, the hashmap must search through all the existing keys in the bucket
to determine whether the new key is already there.

The first insertion compares with 0 keys,
the second with 1 key, the third compares with 2 keys,
and the number of keys compared grows linearly with each insertion.
For $n$ insertions, the total number of keys compared is:

$$
0 + 1 + \dots + (n - 1) = \frac{n(n - 1)}{2} = \frac{n^2 + n}{2}
$$

The total list of $n$ insertions now takes $O(n^2)$ compares to complete[^acc-quad],
as opposed to the average case of $O(n)$ compares.
The operation will now take far more time than it ought to.

The attack is not just limited to insertion.
Every time when an attacked key is being searched for,
the same number of keys will be compared,
so every single operation that would have been $O(1)$ now becomes $O(n)$.
These hashmap operations that would otherwise take negligible time
will now be severely slower,
making the attacker far easier to deplete the program's resources than before.

[^acc-quad]:
    There's even a Tumblr blog for unexpected quadratic complexity in programming languages,
    [Accidentally Quadratic](https://accidentallyquadratic.tumblr.com/).
    You can even find a hashmap-related one
    [here](https://accidentallyquadratic.tumblr.com/post/153545455987/rust-hash-iteration-reinsertion)!
    -- It's almost a manually-introduced hash flooding attack.

This, is what we call a **hash flooding attack**,
taken its name from it flooding the same bucket of the hashmap with colliding keys.

We can demonstrate this with the hashmap implementation we wrote earlier:

```mbt
/// A simple string hasher via the Fowler-Noll-Vo hash function.
/// https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
fn string_fnv_hash(s : String) -> UInt {
  // In reality this should directly operate on the underlying array of the string
  let s_bytes = @encoding/utf16.encode(s)
  let mut acc : UInt = 0x811c9dc5
  for b in s_bytes {
    acc = (acc ^ b.to_uint()) * 0x01000193
  }
  acc
}

fn test_attack(
  n_buckets : Int,
  keys : Array[String],
  hash_fn : (String) -> UInt,
) -> Int {
  let map = { buckets: Array::makei(n_buckets, _ => { values: [] }), hash_fn }
  let mut total_searches = 0
  for key in keys {
    total_searches += map.insert(key, 0)
  }
  total_searches
}

test {
  println("Demonstrate hash flooding attack")
  let bucket_count = 2048
  let target_bucket_id = 42
  let n_collision_want = 1000

  //
  println("First, try to insert non-colliding keys.")
  let non_colliding_keys = Array::makei(n_collision_want,
    i => (i * 37).to_string(radix=36))
  let n_compares_nc = test_attack(
    bucket_count, non_colliding_keys, string_fnv_hash,
  )
  println(
    "Total compares for \{n_collision_want} non-colliding keys: \{n_compares_nc}",
  )
  println("")

  //
  println("Now, we want all keys to collide into bucket #\{target_bucket_id}.")
  let colliding_keys = find_collision(
    bucket_count, target_bucket_id, n_collision_want, string_fnv_hash,
  )
  println("Found \{colliding_keys.length()} colliding keys.")
  let n_compares_c = test_attack(bucket_count, colliding_keys, string_fnv_hash)
  println(
    "Total compares for \{n_collision_want} colliding keys: \{n_compares_c}",
  )

  //
  let increase = n_compares_c.to_double() / n_compares_nc.to_double()
  println("The number of compares increased by a factor of \{increase}")
}
```

The output of the code above is:

```
Demonstrate hash flooding attack
First, try to insert non-colliding keys.
Total compares for 1000 non-colliding keys: 347

Now, with colliding keys...
Found 1000 colliding keys.
Total compares for 1000 colliding keys: 499500
The number of compares increased by a factor of 1439.4812680115274
```

... as can be seen directly, now the insertion is some 1000 times slower!

In reality, although the number of buckets in hashmaps is not fixed like our examples,
they often follow a certain growing sequence,
such as doubling or following a list of predefined prime numbers.
This growth pattern makes the bucket count very predictable.
Thus, an attacker can initiate a hash flooding attack
even if they don't know the exact bucket count.

## Mitigating hash flooding attacks

Hash flooding attack works because the attacker knows exactly how a hash function works,
and how it connects to where the key is inserted into the hashmap.
If we change either of them, the attack will no longer work.

### Seeded hash function

By far, the easiest way to do this is
to prevent the attacker from knowing how the hash algorithm exactly works.
This might sound impossible,
but the properties of the hash function actually **only need to hold within a single hashmap**!

When dealing with hashmaps,
we don't need a single, global "hash value" that can be used everywhere,
because hashmaps don't care about what happens outside them.
Simply swapping out the hash function from table to table,
and you get something that's unpredictable to the attacker.

But hey, you may say, "we don't have an infinite supply of different hash algorithms!"

Well, you do.
Remember that hash functions need to distribute the value across the result space as uniform as possible?
That means, for a good hash function,
a slight change in the input can cause a large change in the output.
So, in order to get a hash function unique to each table,
we only need to feed it some data unique to the table before feeding it the data we want to hash.
This is called a "seed" to the hash function, and each table can now have a different seed to use.

Let's demonstrate how the seed solves the problem
with a seeded hash function and two tables with different seeds:

```mbt
/// A modified version of the FNV hash before to allow a seed to be used.
fn string_fnv_hash_seeded(seed : UInt) -> (String) -> UInt {
  let seed_bytes = seed.to_le_bytes()
  fn string_fnv_hash(s : String) -> UInt {
    let s_bytes = @encoding/utf16.encode(s)
    let mut acc : UInt = 0x811c9dc5
    // Mix in the seed bytes.
    for b in seed_bytes {
      acc = (acc ^ b.to_uint()) * 0x01000193
    }
    // Hash the string bytes.
    for b in s_bytes {
      acc = (acc ^ b.to_uint()) * 0x01000193
    }
    acc
  }

  string_fnv_hash
}

test {
  println("Demonstrate flooding attack mitigation")
  let bucket_count = 2048
  let target_bucket_id = 42
  let n_collision_want = 1000

  // The first table has a seed of 42.
  let seed1 : UInt = 42
  println("We find collisions using the seed \{seed1}")
  let hash_fn1 = string_fnv_hash_seeded(seed1)
  let colliding_keys = find_collision(
    bucket_count, target_bucket_id, n_collision_want, hash_fn1,
  )
  let n_compares_c = test_attack(bucket_count, colliding_keys, hash_fn1)
  println(
    "Total compares for \{n_collision_want} colliding keys with seed \{seed1}: \{n_compares_c}",
  )
  println("")

  // The second table has a different seed
  let seed2 : UInt = 100
  println(
    "We now use a different seed for the second table, this time \{seed2}",
  )
  let hash_fn2 = string_fnv_hash_seeded(seed2)
  let n_compares_nc = test_attack(bucket_count, colliding_keys, hash_fn2)
  println(
    "Total compares for \{n_collision_want} keys that were meant to collide with seed \{seed1}: \{n_compares_nc}",
  )
}
```

The output of the program above was:

```
Demonstrate flooding attack mitigation
We find collisions using 42
Total compares for 1000 colliding keys with seed 42: 499500

We now use a different seed for the second table, this time 100
Total compares for 1000 keys that were meant to collide with seed 42: 6342
```

We can see that,
the keys that were colliding in the first table are not colliding in the second. [^mitigation]
Therefore, we have successfully mitigated the hash flooding attack using this simple trick.

[^mitigation]:
    You may notice that this number is still slightly higher than that we got
    with randomly-generated, non-colliding keys.
    This might be related to that FNV is not designed for the best quality of its output.
    Since the two seeds are pretty close to each other,
    the result might still have some similarity.
    Using a better hash function (or even a cryptographically-secure one like [SipHash][])
    would greatly reduce this effect.

[SipHash]: https://github.com/veorq/SipHash

As of where the seed that randomizes each hashmap comes from...
For programs with access to an external random source (like Linux's `/dev/urandom`),
using that would generally be the best choice.
For programs without such access (such as within a WebAssembly sandbox),
a per-process random seed is also a preferrable solution (this is what Python does).
Even simpler, a simple counter that increments with each seeding attempt could be good enough --
guessing how many hashmaps have been created can still be quite hard for an attacker.

### Other choices

Java uses a different solution,
by falling back to a binary search tree (red-black tree) when too many values occupy the same bucket.
Yes, this requires the keys to be also comparable in addition to being hashable,
but now it guarantees $O(\log n)$ worst-case complexity,
which is far better than $O(n)$.

## Why does it matter to us?

Due to the ubiquitous nature of hashmaps,
it's extremely easy to find some hashmap in a program where you can control the keys,
especially in Web programs.
Headers, cookies, query parameters and JSON bodies are all key-value pairs,
and often stored in hashmaps, which might be vulnerable to hash flooding attacks.

A malicious attacker with enough knowledge of the program
(programming language, frameworks, etc.) can then
try to send carefully-crafted request payloads to the Web API endpoints.
These requests take a lot longer to handle,
so if a regular denial-of-service (DoS) attack takes n requests/s to bring down a server,
a hash flooding attack might only a tiny fraction of that number,
often a magnitude smaller --
making it far more efficient for the attacker.
This turns the DoS attack into a **HashDoS** attack.

Fortunately, by introducing some even slightly unpredictable patterns
(such as a per-process randomness or keyed hashing) into hashmaps,
we can make such attack significantly harder, often impractical.
Also, as such attack is highly dependent on the language,
framework, architecture and implementation of target application,
crafting one could be quite hard already,
and modern, well-configured systems are even more harder to exploit.

## Takeaways

Hashmaps give us powerful, constant-time average access --
but that "constant" depends on assumptions an attacker can sometimes break.
A targeted hash-flooding attack forces many keys into the same bucket
and turns O(1) operations into O(n),
enabling highly efficient resource exhaustion.

The good news is the mitigations are simple and practical:
introduce some unpredictableness to your hashmaps,
use side-channel information when hash alone is not enough, or
rehash when the behavior doesn't look right.
With these, we can keep our hashmaps fast and secure.
