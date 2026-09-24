import type { IRCMessage } from '../types'

const TAG_ESCAPES: Record<string, string> = {
	s: ' ',
	':': ';',
	r: '\r',
	n: '\n',
	'\\': '\\',
}

/** Fast check tags for a given key value pair. */
export function checkTags(line: string, key: string, value: string): boolean {
	if (line.charCodeAt(0) !== 64) {
		return false
	}
	const space = line.indexOf(' ')
	const endOfTags = space === -1 ? line.length : space
	const tagLine = line.slice(0, endOfTags)

	for (const pair of tagLine.split(';')) {
		if (!pair.includes('=')) return false
		const [tagKey, tagValue] = pair.split('=')
		if (tagKey === key) {
			return unescapeTagValue(tagValue) === value
		}
	}

	return false
}

/** Fast parse command from an IRC data line. */
export function command(line: string): string {
	let idx = 0
	// Check for optional tag, starting with '@'
	if (line.charCodeAt(idx) === 64) {
		idx = line.indexOf(' ')
		if (idx === -1) return ''
		idx++
	}

	// Check for optional source, starting with ':'
	if (line.charCodeAt(idx) === 58) {
		idx = line.indexOf(' ', idx)
		if (idx === -1) return ''
		idx++
	}

	const end = line.indexOf(' ', idx) // First <space> is where the command ends
	return end === -1 ? line.slice(idx) : line.slice(idx, end)
}

/**
Extract a data line into an IRCMessage.
*/
export function parseIRC(line: string): IRCMessage {
	/*
	IRC Message Format. Ref - https://modern.ircdocs.horse/#message-format

  message         ::= ['@' <tags> SPACE] [':' <source> SPACE] <command> <parameters> <crlf>
  SPACE           ::=  %x20 *( %x20 )   ; space character(s)
  crlf            ::=  %x0D %x0A        ; "carriage return" "linefeed"

  Examples:

  :irc.example.com CAP LS * :multi-prefix extended-join sasl

  @id=234AB :dan!d@localhost PRIVMSG #chan :Hey what's up!

  CAP REQ :sasl

	*/

	let rest = line
	const terminator = rest.indexOf(' ') // end of tags is indicated by a space
	let end = terminator === -1 ? line.length : terminator

	let tags: Record<string, string> = {}
	// if the line doesn't start with '@', there are no tags
	if (line.charCodeAt(0) === 64) {
		tags = parseTagsUntil(rest, end)
		rest = end === -1 ? '' : rest.slice(end + 1)
	}

	let source = ''
	// if the line doesn't start with a ':', there's no source
	if (rest.charCodeAt(0) === 58) {
		const space = rest.indexOf(' ')
		source = space === -1 ? rest.slice(1) : rest.slice(1, space)
		rest = rest.slice(space + 1)
	}

	let trailing: string | null = null
	const t = rest.indexOf(' :')
	if (t !== -1) {
		trailing = rest.slice(t + 2)
		rest = rest.slice(0, t)
	}

	const [command = '', ...params] = rest
		.split(' ')
		.filter((part) => part !== '')

	return {
		tags,
		source,
		command,
		params,
		trailing,
	}
}

/**
Extract the tags from an IRC message string.
*/
function parseTagsUntil(line: string, end: number): Record<string, string> {
	/*
	Tags Format.

	<tags>          ::= <tag> [';' <tag>]*
  <tag>           ::= <key> ['=' <escaped value>]
  <key>           ::= [ <client_prefix> ] [ <vendor> '/' ] <sequence of letters, digits, hyphens (`-`)>
  <client_prefix> ::= '+'
  <escaped value> ::= <sequence of any characters except NUL, CR, LF, semicolon (`;`) and SPACE>
  <vendor>        ::= <host>

  Examples:

  @id=123AB;rose         ->  {"id": "123AB", "rose": ""}

  @url=;netsplit=tur,ty  ->  {"url": "", "netsplit": "tur,ty"}

	*/

	const tags: Record<string, string> = {}
	const tagsString = line.slice(1, end)

	for (const pair of tagsString.split(';')) {
		const eq = pair.indexOf('=')
		if (eq === -1) tags[pair] = ''
		else {
			const key = pair.slice(0, eq)
			const val = pair.slice(eq + 1)
			tags[key] = unescapeTagValue(val)
		}
	}
	return tags
}

function unescapeTagValue(value: string): string {
	if (!value.includes('\\')) return value
	return value.replace(/\\(.?)/g, (_, c: string) => TAG_ESCAPES[c] ?? c)
}
