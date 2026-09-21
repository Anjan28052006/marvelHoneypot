import { memo, useState } from 'react';
import { Copy, Check } from 'lucide-react';

const DANGEROUS_PATTERNS = [
  '/etc/passwd',
  '/etc/shadow',
  'authorized_keys',
  'rm -rf',
  'wget',
  'curl',
  'nc -e',
  'python -c',
  'bash -i',
  'chmod 777',
  'chmod +x',
  'sudo',
  'id',
  'uname -a',
  'crontab',
];

function highlightCommand(text) {
  if (!text) return text;

  // Split tokens safely
  const tokens = text.split(/(\s+|[|;&><]+)/);

  return tokens.map((token, i) => {
    if (!token) return null;

    // Operators: | && ; > >>
    if (/^[|;&><]+$/.test(token)) {
      return (
        <span key={i} className="font-bold text-fuchsia-400">
          {token}
        </span>
      );
    }

    // Flags: -a, --output, etc.
    if (/^--?[a-zA-Z0-9_-]+$/.test(token)) {
      return (
        <span key={i} className="text-amber-400">
          {token}
        </span>
      );
    }

    // URLs and IP addresses
    if (/^https?:\/\//.test(token) || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(token)) {
      return (
        <span key={i} className="text-sky-300 underline decoration-sky-500/50 underline-offset-2">
          {token}
        </span>
      );
    }

    // Sensitive files & paths
    if (
      token.includes('/etc/passwd') ||
      token.includes('/etc/shadow') ||
      token.includes('.ssh') ||
      token.includes('/dev/') ||
      token.includes('/proc/') ||
      token.includes('/tmp/')
    ) {
      return (
        <span key={i} className="font-semibold text-rose-400">
          {token}
        </span>
      );
    }

    // Common command binaries
    const lower = token.toLowerCase();
    if (
      [
        'curl', 'wget', 'cat', 'sh', 'bash', 'sudo', 'chmod', 'chown', 'rm', 'echo',
        'uname', 'whoami', 'id', 'hostname', 'netstat', 'ps', 'grep', 'find', 'tar',
        'gzip', 'nc', 'nmap', 'scp', 'ssh', 'git', 'python', 'perl', 'ruby', 'gcc',
        'make', 'crontab', 'systemctl', 'service', 'iptables', 'dd', 'kill', 'killall',
      ].includes(lower)
    ) {
      return (
        <span key={i} className="font-semibold text-emerald-300">
          {token}
        </span>
      );
    }

    // Default arguments or text
    return <span key={i}>{token}</span>;
  });
}

function TerminalCommandRow({ cmd, prompt = 'root@honeypot:~#' }) {
  const [copied, setCopied] = useState(false);
  const commandText = cmd.command_text || cmd.input || '';

  const isSuspicious = DANGEROUS_PATTERNS.some((pat) =>
    commandText.toLowerCase().includes(pat.toLowerCase())
  );

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(commandText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const formattedTime = cmd.timestamp
    ? new Date(cmd.timestamp).toLocaleTimeString('en-GB', { hour12: false })
    : null;

  return (
    <div className="terminal-line group flex items-start gap-2 rounded px-2 py-1 font-mono text-[12px] leading-relaxed transition-colors hover:bg-emerald-950/20 sm:text-[13px]">
      {/* Sequence or Time marker */}
      <span className="w-10 shrink-0 select-none text-[10px] text-slate-600 sm:w-12">
        {cmd.sequence_no ? `#${String(cmd.sequence_no).padStart(2, '0')}` : '>>'}
      </span>

      {formattedTime && (
        <span className="hidden select-none text-[10px] text-slate-600 sm:inline-block">
          [{formattedTime}]
        </span>
      )}

      {/* Prompt */}
      <span className="shrink-0 select-none font-semibold text-emerald-600">
        {prompt}
      </span>

      {/* Command body with syntax highlighting */}
      <div className="flex-1 break-all text-slate-200">
        {highlightCommand(commandText)}
        {isSuspicious && (
          <span className="ml-2 inline-block rounded bg-rose-950/80 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-rose-400 border border-rose-800/60">
            DETECTED
          </span>
        )}
      </div>

      {/* Copy button on hover */}
      <button
        type="button"
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-slate-300"
        title="Copy command"
      >
        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

export default memo(TerminalCommandRow);
