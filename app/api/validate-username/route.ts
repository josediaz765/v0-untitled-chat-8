import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

const BAD_WORDS = [
  // Profanity
  "fuck",
  "fuk",
  "fck",
  "f*ck",
  "fuc",
  "fuq",
  "phuck",
  "phuk",
  "shit",
  "sh1t",
  "sh!t",
  "sht",
  "shyt",
  "ass",
  "a$$",
  "azz",
  "@ss",
  "bitch",
  "b1tch",
  "b!tch",
  "biatch",
  "bytch",
  "dick",
  "d1ck",
  "d!ck",
  "dik",
  "dyck",
  "cock",
  "c0ck",
  "cok",
  "kok",
  "pussy",
  "puss",
  "pu$$y",
  "pussie",
  "cunt",
  "c*nt",
  "kunt",
  "damn",
  "dam",
  "d@mn",
  "hell",
  "h3ll",
  "hel",
  "piss",
  "p1ss",
  "pis",
  "bastard",
  "basterd",
  "bstrd",
  "whore",
  "wh0re",
  "hore",
  "hoar",
  "slut",
  "sl*t",
  "sloot",
  // Slurs
  "nigger",
  "nigga",
  "n1gger",
  "n1gga",
  "nigg",
  "niga",
  "n!gga",
  "negro",
  "faggot",
  "fag",
  "f@g",
  "f@ggot",
  "fgt",
  "retard",
  "retrd",
  "r3tard",
  "ret@rd",
  // Sexual
  "porn",
  "p0rn",
  "pr0n",
  "sex",
  "s3x",
  "sexx",
  "xxx",
  "xxxx",
  "nude",
  "nudes",
  "nud3",
  "naked",
  "nak3d",
  "penis",
  "pen1s",
  "pen!s",
  "vagina",
  "vag",
  "v@gina",
  "boob",
  "b00b",
  "boobs",
  "tits",
  "t1ts",
  "titty",
  "cum",
  "c*m",
  "coom",
  "kum",
  // Violence
  "kill",
  "k1ll",
  "kil",
  "murder",
  "murd3r",
  "rape",
  "r@pe",
  "rapist",
  "suicide",
  "suicid3",
  "die",
  "d13",
  // Hate/extremism
  "nazi",
  "naz1",
  "n@zi",
  "hitler",
  "h1tler",
  "isis",
  "1s1s",
  "terrorist",
  "terror",
  "kkk",
  "klan",
  // Drugs
  "drug",
  "drugs",
  "drugg",
  "cocaine",
  "coke",
  "cocain",
  "heroin",
  "heroine",
  "her0in",
  "meth",
  "m3th",
  "methamphetamine",
  "weed",
  "w33d",
  "marijuana",
  "maryjane",
  "crack",
  "crackhead",
  // Other inappropriate
  "bomb",
  "b0mb",
  "pedophile",
  "pedo",
  "ped0",
  "molest",
  "mol3st",
  "incest",
  "1ncest",
  "bestiality",
  // Bypass attempts
  "admin",
  "administrator",
  "moderator",
  "mod",
  "owner",
  "official",
  "staff",
  "support",
]

function containsBadWord(username: string): boolean {
  // Normalize the username: lowercase, remove special chars, replace common substitutions
  let normalized = username.toLowerCase()

  // Replace common letter substitutions
  normalized = normalized
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/!/g, "i")
    .replace(/\*/g, "")
    .replace(/[^a-z]/g, "")

  // Check each bad word
  for (const word of BAD_WORDS) {
    const normalizedWord = word.toLowerCase().replace(/[^a-z]/g, "")
    if (normalized.includes(normalizedWord)) {
      return true
    }
  }

  return false
}

function generateCleanSuggestions(): string[] {
  const adjectives = [
    "Cool",
    "Epic",
    "Pro",
    "Swift",
    "Ninja",
    "Cyber",
    "Neo",
    "Star",
    "Dark",
    "Blaze",
    "Thunder",
    "Shadow",
    "Frost",
    "Storm",
    "Night",
  ]
  const nouns = [
    "Gamer",
    "Wolf",
    "Hawk",
    "Knight",
    "Rider",
    "Hunter",
    "Warrior",
    "Phoenix",
    "Dragon",
    "Falcon",
    "Tiger",
    "Lion",
    "Viper",
    "Cobra",
    "Eagle",
  ]

  const suggestions: string[] = []
  const usedCombos = new Set<string>()

  while (suggestions.length < 3) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(Math.random() * 999)
    const combo = `${adj}${noun}${num}`

    if (!usedCombos.has(combo)) {
      usedCombos.add(combo)
      suggestions.push(combo)
    }
  }

  return suggestions
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Quick check for obvious bad words first
    if (containsBadWord(username)) {
      const suggestions = generateCleanSuggestions()
      return NextResponse.json({
        isValid: false,
        reason: "This username contains inappropriate content. Please choose another.",
        suggestions,
      })
    }

    try {
      const { text: aiResult } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt: `You are a strict content moderator for a gaming platform used by children and teens.

Analyze this username: "${username}"

REJECT the username if it:
1. Contains ANY inappropriate, offensive, vulgar, or sexual content (even subtle, hidden, or disguised)
2. References drugs, alcohol, violence, weapons, hate speech, or discrimination
3. Uses numbers/symbols to bypass filters (like "b1tch", "a$$", "pr0n", "n1gga")
4. Contains slurs, insults, or derogatory terms in any form
5. Impersonates authority figures (admin, mod, owner, official, staff)
6. References inappropriate body parts or acts
7. Contains racist, sexist, homophobic, or transphobic content
8. References self-harm, suicide, or eating disorders
9. Contains hidden meanings that spell out bad words

Be VERY strict. When in doubt, REJECT.

Reply with ONLY one word: "VALID" if completely appropriate for all ages, or "INVALID" if there's ANY concern.`,
      })

      const isValid = aiResult.trim().toUpperCase() === "VALID"

      if (!isValid) {
        const suggestions = generateCleanSuggestions()
        return NextResponse.json({
          isValid: false,
          reason: "This username may contain inappropriate content. Please choose another.",
          suggestions,
        })
      }

      return NextResponse.json({ isValid: true })
    } catch (aiError) {
      // If AI fails, fall back to just the bad word check (which passed)
      console.error("AI validation error:", aiError)
      return NextResponse.json({ isValid: true })
    }
  } catch (error) {
    console.error("Username validation error:", error)
    // On error, allow the username (fail open for UX)
    return NextResponse.json({ isValid: true })
  }
}
