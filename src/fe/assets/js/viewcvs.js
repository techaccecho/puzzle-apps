/**
 * SourceForge / ViewCVS Client Controller
 * Project: echo (Archived Repository)
 * Enhanced ARG Investigation Edition
 * Authors: Dedicated CVS Archive & Restoration Team (independent of blog community)
 */

(function () {
  // In-universe virtual filesystem for the recovered 'echo' game repository
  const REPO_DATA = {
    name: "echo",
    currentPath: "/",
    activeTab: "files", // 'files' | 'commits' | 'irc' | 'forensics' | 'stats'
    activeFile: null,
    hexMode: false,
    soundEnabled: true,
    filterQuery: "",

    commits: [
      {
        id: "commit-15",
        hash: "e7c01b2",
        author: "cvsadmin",
        date: "2004-11-14 18:30:14",
        message: "Archive repository: Project halted pending root portal unlock sequence",
        file: "README.md",
        hasDiff: false,
      },
      {
        id: "commit-14",
        hash: "f19d2a0",
        author: "cvsadmin",
        date: "2004-11-09 23:45:00",
        message: "EMERGENCY: Freeze repository, revoke dcorvin commit rights, file incident report",
        file: "docs/INCIDENT_REPORT_JULY8.md",
        hasDiff: false,
      },
      {
        id: "commit-13",
        hash: "c38e401",
        author: "dcorvin",
        date: "2004-11-08 21:18:22",
        message: "WARNING: The executable attempted an outbound connection to onion host during portal test",
        file: "tools/network/beacon_monitor.py",
        hasDiff: false,
      },
      {
        id: "commit-12",
        hash: "4a8f029",
        author: "vstrickland",
        date: "2004-11-06 14:22:10",
        message: "[CRITICAL] Extract portal seal verification from damaged Sector 4 (echo_part2_0392)",
        file: "src/world/portal.c",
        hasDiff: true,
      },
      {
        id: "commit-11",
        hash: "93df10a",
        author: "vstrickland",
        date: "2004-10-28 17:40:12",
        message: "Carve Level 4 pale void stub from high-offset sectors (addresses 0x8A00-0x9200)",
        file: "src/world/level4_pale_void.c",
        hasDiff: false,
      },
      {
        id: "commit-10",
        hash: "b52f991",
        author: "vstrickland",
        date: "2004-09-15 11:15:40",
        message: "Decompile Level 3 grove generator switches & wire to state machine",
        file: "src/world/level3_grove.c",
        hasDiff: false,
      },
      {
        id: "commit-9",
        hash: "82bc44e",
        author: "kmatsuda",
        date: "2004-07-22 09:48:22",
        message: "Fix collision glitch on Level 2 crumble bridge & calibrate camera bounds",
        file: "src/world/level2_lagoon.c",
        hasDiff: false,
      },
      {
        id: "commit-8",
        hash: "71ac901",
        author: "vstrickland",
        date: "2004-05-18 16:35:10",
        message: "Decompile Level 2 Haven water current math (matches HAVEN_MAP_03.png)",
        file: "src/world/level2_lagoon.c",
        hasDiff: false,
      },
      {
        id: "commit-7",
        hash: "a07b312",
        author: "hchen",
        date: "2004-03-12 14:12:05",
        message: "Recover orphaned NPC strings from sector 0x6E00 (dialogue referencing researcher)",
        file: "src/entities/shadow_dialogue.c",
        hasDiff: false,
      },
      {
        id: "commit-6",
        hash: "66de882",
        author: "vstrickland",
        date: "2003-11-04 10:04:19",
        message: "Disassemble dead-code strings in dialogue table (found HAVEN_ENTRY_GRANTED)",
        file: "src/entities/dialogue.c",
        hasDiff: false,
      },
      {
        id: "commit-5",
        hash: "55ba30e",
        author: "hchen",
        date: "2003-08-16 13:05:00",
        message: "Reconstruct Blacksmith NPC dialogue tree from greet.dialogue binary dump",
        file: "src/entities/blacksmith.c",
        hasDiff: false,
      },
      {
        id: "commit-4",
        hash: "44cd190",
        author: "hchen",
        date: "2003-04-10 15:40:10",
        message: "Extract VGA 256-color palette tables & CRT phosphor green registers",
        file: "src/gfx/palette.c",
        hasDiff: false,
      },
      {
        id: "commit-3",
        hash: "33cf812",
        author: "kmatsuda",
        date: "2002-10-05 10:20:15",
        message: "Add tilemap decoder and sprite extraction tools for recovered floppy media",
        file: "tools/decompiler/sector_dump.py",
        hasDiff: false,
      },
      {
        id: "commit-2",
        hash: "22be004",
        author: "kmatsuda",
        date: "2002-04-12 11:32:00",
        message: "Add SoundBlaster DSP synthesis drivers and 1420Hz carrier wave decoder",
        file: "src/audio/sound_server.c",
        hasDiff: false,
      },
      {
        id: "commit-1",
        hash: "11aa005",
        author: "cvsadmin",
        date: "2001-03-15 08:00:00",
        message: "Initial commit of raw recovered sectors from floppy disc dumps (v0.1.0-alpha)",
        file: "Makefile",
        hasDiff: false,
      },
    ],

    ircLogs: [
      { time: "2004-11-05 21:04:12", nick: "vstrickland", msg: "Disk image #4 carving finished. Sector 0x7F2A is wild." },
      { time: "2004-11-05 21:05:01", nick: "kmatsuda", msg: "Did you get the header? Was it standard FAT12?" },
      { time: "2004-11-05 21:05:33", nick: "vstrickland", msg: "Yeah, but it wasn't magnetic wear. Someone intentionally flipped the CRC polynomials. It was crafted to trigger an INT 13h fault on standard floppy controllers." },
      { time: "2004-11-05 21:06:14", nick: "hchen", msg: "Wait, why would an unreleased 2001 game have anti-forensic parity traps?" },
      { time: "2004-11-05 21:07:02", nick: "vstrickland", msg: "Look at the playtester's notes from 2003. Someone spent three weeks trying to dump the same sector. They wrote: 'The gate rejects conventional read heads. It demands the three parts.'" },
      { time: "2004-11-05 21:08:19", nick: "cvsadmin", msg: "What three parts? We only have the sector dumps." },
      { time: "2004-11-05 21:09:05", nick: "hchen", msg: "Part 1 is in the broadcast transmission ASCII art (WHN). Part 2 is the Haven lagoon coordinate vector (K33P)." },
      { time: "2004-11-05 21:10:44", nick: "vstrickland", msg: "And Part 3 was right here inside Sector 0x7F2A: echo_part2_0392.", highlight: true },
      { time: "2004-11-07 21:11:30", nick: "dcorvin", msg: "Guys... I just built bin/echo_game with the gate unlocked and walked Josh past coordinate (2003, 502)." },
      { time: "2004-11-07 21:12:02", nick: "kmatsuda", msg: "What happened? Did the Level 4 grass tile render?" },
      { time: "2004-11-07 21:12:45", nick: "dcorvin", msg: "No sprites rendered. My network card activity LEDs went solid amber. The process spawned a raw socket thread trying to connect to http://echoarchive5j7x2k.onion on port 1420.", highlight: true },
      { time: "2004-11-07 21:13:10", nick: "cvsadmin", msg: "dcorvin, what executable did you just run? Where did port 1420 come from?" },
      { time: "2004-11-07 21:14:00", nick: "dcorvin", msg: "It was in the high sectors! Address 0x8A00 (src/world/level4_pale_void.c). It's not a game level. It's a transmitter." },
      { time: "2004-11-07 21:15:22", nick: "cvsadmin", msg: "Pull the ethernet cable right now. Kill PID immediately." },
      { time: "2004-11-07 21:16:04", nick: "dcorvin", msg: "It's playing a continuous sine tone through the motherboard piezo speaker. 1420.405 Hz. The process won't respond to SIGKILL." },
      { time: "2004-11-07 21:17:15", nick: "cvsadmin", msg: "Shut down the breaker switch in Rack 4. I am revoking dcorvin's commit key and locking the CVS repository to READ-ONLY.", highlight: true },
      { time: "2004-11-08 18:30:00", nick: "cvsadmin", msg: "Repository archived. All source frozen. The combined passcode must be entered at the terminal console to seal the archive." }
    ],

    sectorMap: `================================================================================
PHYSICAL FLOPPY DISK RECOVERY MAP (1.44 MB 3.5" HD FLOPPY - DUMP #001)
Drive: Sony MPF920-E | Media: 3M High Density 2HD | Controller: Catweasel Mk4
Analysis: Raw sector carving & polynomial parity bypass (LUMEN-C 0.9 signature)
================================================================================

Track 00-01 (Head 0/1): [BOOT]  FAT12 BIOS Parameter Block, OEM: "ECHO_01 "
  [SECTOR 0x0000 - 0x01FF] Bootsector (Intact)
  [SECTOR 0x0200 - 0x11FF] File Allocation Tables 1 & 2 (Clean)
  [SECTOR 0x1200 - 0x1DFF] Root Directory Table (24 entries recovered)

Track 02-18 (Head 0/1): [CORE & ENGINE]
  [SECTOR 0x1E00 - 0x2A00] main.c, engine.c, save_system.c (Decompiled)
  [SECTOR 0x2A01 - 0x3400] security.c, types.h, world.h, clock.h (Decompiled)
  [SECTOR 0x3401 - 0x3FFF] entity.c, inventory.c, blacksmith.c (Decompiled)

Track 19-35 (Head 0/1): [WORLD LEVELS]
  [SECTOR 0x4000 - 0x4BFF] level1_grasslands.c (Monolith bounds X=2003 Y=502)
  [SECTOR 0x4C00 - 0x5BFF] level2_lagoon.c (Currents matrix & HAVEN_MAP_03)
  [SECTOR 0x5C00 - 0x6DFF] level3_grove.c (Gem sequence generator)

Track 36-50 (Head 0/1): [CRITICAL ANOMALY SECTORS]
  [SECTOR 0x6E00 - 0x7800] shadow_dialogue.c (Unreferenced NPC memories)
  [SECTOR 0x7801 - 0x7F29] Bad CRC region (Repeated pattern: 0x96 0xFF 0x00)
  [SECTOR 0x7F2A] --------> CARVED SECTOR: portal.c verification routine!
                           * CRC bypassed using polynomial 0xEDB88320
                           * Target String recovered: "echo_part2_0392"
  [SECTOR 0x7F2B - 0x89FF] Zero-filled gap (Magnetic erasure detected)

Track 51-79 (Head 0/1): [PALE VOID & TELEMETRY ENGINE]
  [SECTOR 0x8A00 - 0x9BFF] level4_pale_void.c (Unfinished root portal code)
  [SECTOR 0x9C00 - 0xACFF] sound_server.c (DSP carrier synthesis 1420.405 Hz)
  [SECTOR 0xAD00 - 0xB7FF] palette.c, crt_filter.c (VGA DAC registers)
  [SECTOR 0xB800 - 0xC3FF] tools/network/beacon_monitor.py (Traffic log)

Status: 1,474,560 / 1,474,560 bytes analyzed. Rebuild halted by administration.
================================================================================`,

    files: {
      "README.md": {
        type: "doc",
        rev: "1.15",
        age: "Archived (2004-11-14)",
        author: "cvsadmin",
        log: "Archive repository: Project halted pending root portal unlock sequence",
        content: `# echo — 2D Narrative Adventure Engine

> **SourceForge.net Administrative Notice (November 14, 2004)**
> This project CVS repository has been marked as abandoned and transitioned to read-only archival status.
> Active commit access is disabled; all source trees are preserved in read-only mode for historical reference.

## Overview
"echo" is a 2D narrative adventure game originally developed between 2000 and 2002. The codebase was archived after anomalous behavior was reported during late-stage engine tests in 2003–2004.

Our team recovered partial 3.5" floppy disk dumps and unallocated hard drive sectors containing the original C source and tile data. We have been systematically decompiling the binary sectors and porting the game so that players can experience the original world.

## Current Recovery Status
- **Level 1 (Grasslands & Blacksmith Yard)**: Overworld terrain and village forge. Monolith coordinates verified at (2003, 502).
- **Level 2 (Haven Map 03 Lagoon)**: Water current vectors and bridge crumble timers restored from HAVEN_MAP_03.png.
- **Level 3 (Corrupted Grove)**: Generator breaker sequence reverse-engineered (Blue -> Red -> Green -> Purple).
- **Level 4 & The Root Portal**: **BLOCKED & QUARANTINED**. The portal state machine in \`src/world/portal.c\` was sealed with a cryptographic 3-part fail-safe.
- **Outbound Beacon Incident**: Execution of unsealed Level 4 triggers outbound socket communication to http://echoarchive5j7x2k.onion.

## Three-Part Cipher Correlation
According to unreferenced terminal documentation, unlocking the root console requires three distinct fragments gathered from across the investigation:
1. **Part 1 (Broadcast Transmission)**: Embedded in the Grim Reaper ASCII art (\`WHN\`).
2. **Part 2 (Haven Lagoon)**: Recovered from the unlisted coordinate dialogue (\`K33P\`).
3. **Part 3 (Floppy Sector 0x7F2A)**: Carved from \`src/world/portal.c\` (\`echo_part2_0392\`).

Combined console passcode: \`WHN_K33P_echo_part2_0392\`
`,
      },

      "CHANGELOG.md": {
        type: "doc",
        rev: "1.15",
        age: "2004-11-14",
        author: "cvsadmin",
        log: "Document recovery versions v0.1.0 through v0.4.3-freeze",
        content: `# Changelog for echo Rebuild

### [v0.4.3-freeze] - 2004-11-14
- Freeze repository and lock CVS permissions to read-only.
- Filed Security Incident Report SEC-2026-0708-ECHO (quarantining transmitter socket).

### [v0.4.2] - 2004-11-06
- Decompiled portal barrier routine in \`src/world/portal.c\`.
- Discovered hardcoded key Part 3 in Sector 0x7F2A: \`echo_part2_0392\`.

### [v0.4.0] - 2004-10-28
- Carved Sector 0x8A00 into \`src/world/level4_pale_void.c\`.
- Added carrier tone generator (1420.405 Hz) in \`src/audio/sound_server.c\`.

### [v0.3.5] - 2004-09-15
- Rebuilt Level 3 grove generator switches.
- Added dialogue parser matching original story drafts.

### [v0.2.1] - 2004-05-18
- Reconstructed water current matrix from \`HAVEN_MAP_03.png\`.
- Restored Blacksmith shop inventory logic.

### [v0.1.0] - 2001-03-15
- Initial dump of salvaged floppy sectors.
`,
      },

      "Makefile": {
        type: "doc",
        rev: "1.4",
        age: "2004-11-02",
        author: "kmatsuda",
        log: "Update build targets for GCC 3.x and modern compiler shims",
        content: `CC = gcc
CFLAGS = -Wall -O2 -I./include -std=c99
LDFLAGS = -lSDL -lm

SRCS = src/core/main.c src/core/engine.c src/core/clock.c src/core/flags.c \\
       src/core/save_system.c src/core/security.c \\
       src/entities/player.c src/entities/inventory.c src/entities/blacksmith.c \\
       src/entities/dialogue.c src/entities/shadow_dialogue.c \\
       src/world/level1_grasslands.c src/world/level2_lagoon.c \\
       src/world/level3_grove.c src/world/level4_pale_void.c src/world/portal.c \\
       src/audio/sound_server.c src/gfx/palette.c

OBJS = $(SRCS:.c=.o)
TARGET = bin/echo_game

all: $(TARGET)

$(TARGET): $(OBJS)
	@mkdir -p bin
	$(CC) $(OBJS) $(LDFLAGS) -o $@

clean:
	rm -f $(OBJS) $(TARGET)
`,
      },

      "docs/INCIDENT_REPORT_JULY8.md": {
        type: "doc",
        rev: "1.1",
        age: "2004-11-09",
        author: "cvsadmin",
        log: "EMERGENCY: File formal incident report on Level 4 network socket execution",
        content: `# INCIDENT REPORT — SEC-2026-0708-ECHO

**Classification**: RESTRICTED / QUARANTINE SNAPSHOT
**Date of Incident**: November 8–9, 2004
**Report Author**: cvsadmin (Infrastructure Security)
**Target**: Project \`echo\` Reconstructed Repository

## 1. Executive Summary
On November 8, 2004 at 21:12 UTC, developer \`dcorvin\` compiled experimental build \`v0.4.3-dev\` containing the unsealed root portal state routine extracted from Sector 0x7F2A. Upon initializing player coordinates at the Level 4 threshold (\`X: 2003, Y: 502\`), the binary bypassed the user-space emulator and executed an unmapped payload directly in kernel memory.

## 2. Forensic Findings
- **Telemetry Beacon**: Network monitor captured an outbound SYN packet addressed to \`http://echoarchive5j7x2k.onion\` on port \`1420\`.
- **Anomalous Audio Subsystem**: SoundBlaster driver emulation initiated a persistent sinusoidal carrier tone at \`1420.405 MHz\` (correlating to the 21cm Hydrogen Line observed in radio astronomy records).
- **Subverted Source**: Sector \`0x8A00\` (\`src/world/level4_pale_void.c\`) was not written in 2001 or 2026. Code structure indicates compilation artifacts generated by an automated remote compiler (\`LUMEN-C 0.9\`).

## 3. Corrective Actions Taken
1. Reverted developer \`dcorvin\`'s test commit and severed external commit privileges.
2. Isolated the development host workstation from the local network.
3. Locked CVS repository permissions to **READ-ONLY** (\`chmod -R 0555 /cvsroot/echo\`).
4. Reconstructed portal key validation (\`echo_part2_0392\`) preserved in \`src/world/portal.c\` for forensic verification by authorized investigators only.
`,
      },

      "docs/IRC_LOGS_2026_07.txt": {
        type: "doc",
        rev: "1.2",
        age: "2004-11-09",
        author: "hchen",
        log: "Archive #echo-dev IRC logs covering Sector 0x7F2A breakthrough",
        content: `[2004-11-05 21:04:12] <vstrickland> disk image #4 carving finished. Sector 0x7F2A is wild.
[2004-11-05 21:05:01] <kmatsuda> did you get the header?
[2004-11-05 21:05:33] <vstrickland> yeah, but it wasn't magnetic wear. Someone intentionally flipped the CRC polynomials. It was designed to trigger an INT 13h fault on any standard IBM floppy controller.
[2004-11-05 21:06:14] <hchen> wait, why would an unreleased 2001 game have anti-forensic parity traps?
[2004-11-05 21:07:02] <vstrickland> look at the playtester's notes from 2003. Someone spent three weeks trying to dump the same sector. They wrote: "The gate rejects conventional read heads. It demands the three parts."
[2004-11-05 21:08:19] <cvsadmin> what three parts?
[2004-11-05 21:09:05] <hchen> Part 1 is in the broadcast transmission ASCII art (WHN). Part 2 is the Haven lagoon coordinate vector (K33P).
[2004-11-05 21:10:44] <vstrickland> and Part 3 was right here inside 0x7F2A: echo_part2_0392.
[2004-11-07 21:11:30] <dcorvin> guys... I just built bin/echo_game with the gate unlocked and walked Josh past (2003, 502).
[2004-11-07 21:12:02] <kmatsuda> what happened?
[2004-11-07 21:12:45] <dcorvin> my router lit up like a Christmas tree. The process spawned a raw socket thread that tried to connect to an onion endpoint on port 1420.
[2004-11-07 21:13:10] <cvsadmin> dcorvin, what did you just execute?
[2004-11-07 21:14:00] <dcorvin> I didn't write it! It was in the high sectors! Address 0x8A00. It's not a game level. It's a transmitter.
[2004-11-07 21:15:22] <cvsadmin> Pull the ethernet cable now.
[2004-11-07 21:16:04] <dcorvin> it's playing audio through the motherboard speaker. 1420 Hz.
[2004-11-07 21:17:15] <cvsadmin> FREEZE REPO. DO NOT COMMIT. I'm locking the CVS tree.
`,
      },

      "docs/ANOMALY_NOTEBOOK_INDEX.md": {
        type: "doc",
        rev: "1.4",
        age: "2004-10-15",
        author: "hchen",
        log: "Index anomalous 2003 journal sessions with codebase references",
        content: `# Anomaly Notebook Index & Correlation Table

Salvaged from physical 2003 research journals and cross-referenced with repository source files:

| Notebook Ref | Date | Observed Game Anomaly | Codebase Location | Correlation / Passcode Fragment |
|---|---|---|---|---|
| **Entry RS-012** | 2003-04-12 | Blacksmith mentions the grove being shut "since before the towers fell" | \`src/entities/blacksmith.c\` | NPC dialogue branch confirmed |
| **Entry RS-019** | 2003-05-02 | Monolith coordinate anomaly at \`(2003, 502)\` | \`src/world/level1_grasslands.c\` | Boundary anchor for Level 4 warp |
| **Entry RS-025** | 2003-06-11 | Screenshot file corrupted into Grim Reaper ASCII art transmission | Broadcast Clue 1 | **Passcode Part 1: \`WHN\`** |
| **Entry RS-028** | 2003-06-28 | Unreachable dialogue string \`HAVEN_ENTRY_GRANTED\` & lagoon currents | \`src/world/level2_lagoon.c\` | **Passcode Part 2: \`K33P\`** |
| **Entry RS-034** | 2003-07-04 | Corrupted Grove gem order: Blue -> Red -> Green -> Purple | \`src/world/level3_grove.c\` | Pedestal sequence unlocks the gate |
| **Entry RS-039** | 2003-07-16 | Sector 0x7F2A encrypted with 3-key cipher | \`src/world/portal.c\` | **Passcode Part 3: \`echo_part2_0392\`** |
| **Entry RS-044** | 2003-08-01 | *"The three parts are not separate words. They are a single sentence."* | Combined Console | **\`WHN_K33P_echo_part2_0392\`** |
`,
      },

      "docs/FORENSICS_SECTOR_MAP.txt": {
        type: "doc",
        rev: "1.3",
        age: "2004-11-03",
        author: "vstrickland",
        log: "Add complete floppy track breakdown and sector carving offsets",
        content: `================================================================================
PHYSICAL FLOPPY DISK RECOVERY MAP (1.44 MB 3.5" HD FLOPPY - DUMP #001)
Drive: Sony MPF920-E | Media: 3M High Density 2HD | Controller: Catweasel Mk4
================================================================================

Track 00-01 (Head 0/1): [BOOT]  FAT12 BIOS Parameter Block, OEM: "ECHO_01 "
  [SECTOR 0x0000 - 0x01FF] Bootsector (Intact)
  [SECTOR 0x0200 - 0x11FF] File Allocation Tables 1 & 2 (Clean)
  [SECTOR 0x1200 - 0x1DFF] Root Directory Table (24 entries recovered)

Track 02-18 (Head 0/1): [CORE & ENGINE]
  [SECTOR 0x1E00 - 0x2A00] main.c, engine.c, save_system.c (Decompiled)
  [SECTOR 0x2A01 - 0x3400] security.c, types.h, world.h, clock.h (Decompiled)
  [SECTOR 0x3401 - 0x3FFF] entity.c, inventory.c, blacksmith.c (Decompiled)

Track 19-35 (Head 0/1): [WORLD LEVELS]
  [SECTOR 0x4000 - 0x4BFF] level1_grasslands.c (Monolith bounds X=2003 Y=502)
  [SECTOR 0x4C00 - 0x5BFF] level2_lagoon.c (Currents matrix & HAVEN_MAP_03)
  [SECTOR 0x5C00 - 0x6DFF] level3_grove.c (Gem sequence generator)

Track 36-50 (Head 0/1): [CRITICAL ANOMALY SECTORS]
  [SECTOR 0x6E00 - 0x7800] shadow_dialogue.c (Unreferenced NPC memories)
  [SECTOR 0x7801 - 0x7F29] Bad CRC region (Repeated pattern: 0x96 0xFF 0x00)
  [SECTOR 0x7F2A] --------> CARVED SECTOR: portal.c verification routine!
                           * CRC bypassed using polynomial 0xEDB88320
                           * String recovered: "echo_part2_0392"
  [SECTOR 0x7F2B - 0x89FF] Zero-filled gap (Magnetic erasure detected)

Track 51-79 (Head 0/1): [PALE VOID & TELEMETRY ENGINE]
  [SECTOR 0x8A00 - 0x9BFF] level4_pale_void.c (Unfinished root portal code)
  [SECTOR 0x9C00 - 0xACFF] sound_server.c (DSP carrier synthesis 1420.405 Hz)
  [SECTOR 0xAD00 - 0xB7FF] palette.c, crt_filter.c (VGA DAC registers)
  [SECTOR 0xB800 - 0xC3FF] tools/network/beacon_monitor.py (Traffic log)

Status: 1,474,560 / 1,474,560 bytes analyzed. Rebuild halted by administration.
================================================================================
`,
      },

      "docs/RECOVERY_LOG.md": {
        type: "doc",
        rev: "1.4",
        age: "2004-10-25",
        author: "vstrickland",
        log: "Log sector 0x7F2A extraction details",
        content: `# Disk Recovery & Sector Forensics Log

- **Sector 0x1A00 - 0x2400**: Intact. Contained core game loop, clock system, and Blacksmith dialogue tables.
- **Sector 0x3800**: Minor magnetic degradation. Tilemap layer 2 blitter restored.
- **Sector 0x5C20**: Level 2 Haven currents math recovered.
- **Sector 0x7F2A**: Bad checksum. After three hex passes, carved the portal state machine routine. Extracted string: \`echo_part2_0392\`.
`,
      },

      "docs/ARCHITECTURE.md": {
        type: "doc",
        rev: "1.2",
        age: "2004-09-02",
        author: "kmatsuda",
        log: "Outline engine subsystem dependencies",
        content: `# echo Architecture Overview

\`\`\`
[ main.c ] --> [ engine.c ] --> [ world/ ] (levels 1-4, portal)
                    |
                    +--> [ entities/ ] (player, inventory, blacksmith, dialogue)
                    |
                    +--> [ audio/ ] (SoundBlaster 16 DSP carrier)
                    |
                    +--> [ core/clock.c ] (16-min day-night lighting)
                    |
                    +--> [ core/flags.c ] (world story state)
                    |
                    +--> [ save_system.c ] (persists flags & inventory)
\`\`\`
`,
      },

      "docs/NARRATIVE_ALIGNMENT.md": {
        type: "doc",
        rev: "1.3",
        age: "2004-08-14",
        author: "hchen",
        log: "Cross-reference recovered code with RS-025 and RS-028 research notes",
        content: `# Research Notes Alignment

1. **Research Session RS-025 (Missing Files)**:
   Archive notes indicate Screenshot_024.png vanished. In our disk carving, the file was corrupted into ASCII art (Grim Reaper).
2. **Research Session RS-028 (The Haven)**:
   Playtester log: *"I found it embedded in a forgotten dialogue condition: HAVEN_ENTRY_GRANTED."*
   Confirmed: See \`src/entities/dialogue.c\`.
3. **Preparing Final Route (2003-07-18)**:
   Final route documented through the pale grass. The root portal at the end of Level 4 requires three keys.
`,
      },

      "docs/KNOWN_ISSUES.md": {
        type: "doc",
        rev: "1.1",
        age: "2004-06-12",
        author: "kmatsuda",
        log: "Document Sector 07 coordinate drift glitch",
        content: `# Known Issues & Engine Quirks

- Sector 07 coordinate drift occurs when player position X exceeds 2003.
- Monolith collision bounds occasionally skip physics frames on low-latency renders.
`,
      },

      "include/types.h": {
        type: "h",
        rev: "1.3",
        age: "2004-08-10",
        author: "kmatsuda",
        log: "Define core coordinate structures, inventory enums, and day phases",
        content: `#ifndef ECHO_TYPES_H
#define ECHO_TYPES_H

#include <stdint.h>
#include <stdbool.h>

#define SCREEN_WIDTH  640
#define SCREEN_HEIGHT 480
#define TILE_SIZE     16
#define HOTBAR_SIZE   4
#define INV_CAPACITY  16

typedef struct {
    int32_t x;
    int32_t y;
} vec2_t;

typedef struct {
    float x;
    float y;
} vec2f_t;

typedef struct {
    int32_t x;
    int32_t y;
    int32_t w;
    int32_t h;
} rect2_t;

typedef enum {
    DIR_DOWN  = 0,
    DIR_UP    = 1,
    DIR_LEFT  = 2,
    DIR_RIGHT = 3
} direction_t;

typedef enum {
    ITEM_NONE          = 0,
    ITEM_IRON_AXE      = 1,
    ITEM_FISHING_ROD   = 2,
    ITEM_PHOSPHOR_LAMP = 3,
    ITEM_LAGOON_FISH   = 4,
    ITEM_MAPLE_WOOD    = 5,
    ITEM_COPPER_KEY    = 6,
    ITEM_ANOMALY_NOTE  = 7
} item_id_t;

typedef enum {
    SEAL_LOCKED,
    SEAL_IN_PROGRESS,
    SEAL_UNLOCKED,
    SEAL_COLLAPSED
} portal_status_t;

typedef enum {
    PHASE_MORNING   = 0,
    PHASE_AFTERNOON = 1,
    PHASE_EVENING   = 2,
    PHASE_NIGHT     = 3
} day_phase_t;

#endif /* ECHO_TYPES_H */
`,
      },

      "include/world.h": {
        type: "h",
        rev: "1.4",
        age: "2004-09-12",
        author: "kmatsuda",
        log: "Define map dimensions, collision grid, and zone enum",
        content: `#ifndef ECHO_WORLD_H
#define ECHO_WORLD_H

#include "types.h"

#define MAP_WIDTH  128
#define MAP_HEIGHT 128

typedef enum {
    TILE_EMPTY       = 0,
    TILE_GRASS       = 1,
    TILE_COBBLE      = 2,
    TILE_WATER       = 3,
    TILE_SAND        = 4,
    TILE_BRIDGE      = 5,
    TILE_CRUMBLE     = 6,
    TILE_WALL_RUBBLE = 7,
    TILE_VOID        = 8
} tile_type_t;

typedef enum {
    ZONE_LEVEL1_GRASSLANDS = 0,
    ZONE_LEVEL2_LAGOON     = 1,
    ZONE_LEVEL3_GROVE      = 2,
    ZONE_LEVEL4_PORTAL     = 3
} world_zone_t;

typedef struct {
    world_zone_t zone_id;
    uint8_t tiles[MAP_HEIGHT][MAP_WIDTH];
    uint8_t collision[MAP_HEIGHT][MAP_WIDTH];
    vec2_t spawn_point;
    vec2_t monolith_pos;
} map_grid_t;

void world_init(void);
void world_load_zone(world_zone_t zone);
tile_type_t world_get_tile(int x, int y);
bool world_is_solid(int x, int y);
float world_get_terrain_drag(int x, int y);

#endif /* ECHO_WORLD_H */
`,
      },

      "include/clock.h": {
        type: "h",
        rev: "1.2",
        age: "2004-07-15",
        author: "kmatsuda",
        log: "Day-night cycle clock interface and lighting tint definitions",
        content: `#ifndef ECHO_CLOCK_H
#define ECHO_CLOCK_H

#include "types.h"

#define DAY_SECONDS 960.0f /* 16 minutes per day, matching clock.gd */
#define WAKE_HOUR   7.0f

typedef struct {
    float r;
    float g;
    float b;
} rgb_color_t;

typedef struct {
    int day;
    float hour; /* 0.0 - 24.0 */
    bool running;
    day_phase_t phase;
    rgb_color_t current_tint;
    int sky_count;
} clock_system_t;

extern clock_system_t g_clock;

void clock_init(void);
void clock_tick(float dt);
void clock_sleep_until_morning(void);
day_phase_t clock_get_phase(void);
rgb_color_t clock_get_ambient_tint(void);

#endif /* ECHO_CLOCK_H */
`,
      },

      "include/flags.h": {
        type: "h",
        rev: "1.2",
        age: "2004-06-20",
        author: "hchen",
        log: "World progression flags hash store declaration",
        content: `#ifndef ECHO_FLAGS_H
#define ECHO_FLAGS_H

#include <stdbool.h>

#define MAX_FLAGS 256
#define MAX_FLAG_KEY_LEN 64

typedef struct {
    char key[MAX_FLAG_KEY_LEN];
    bool value;
} flag_entry_t;

void flags_init(void);
bool flags_has(const char *key);
void flags_set(const char *key, bool value);
void flags_unset(const char *key);
int flags_count(void);
void flags_clear(void);

#endif /* ECHO_FLAGS_H */
`,
      },

      "include/inventory.h": {
        type: "h",
        rev: "1.3",
        age: "2004-08-18",
        author: "hchen",
        log: "Hotbar and bag inventory service definitions",
        content: `#ifndef ECHO_INVENTORY_H
#define ECHO_INVENTORY_H

#include "types.h"

typedef struct {
    item_id_t id;
    char name[32];
    int amount;
    int max_stack;
} inv_slot_t;

typedef struct {
    inv_slot_t slots[INV_CAPACITY];
    int selected; /* 0..HOTBAR_SIZE-1 */
} inventory_t;

void inv_init(inventory_t *inv);
bool inv_insert(inventory_t *inv, item_id_t item, int amount, const char *name, int max_stack);
bool inv_remove(inventory_t *inv, item_id_t item, int amount);
bool inv_has(const inventory_t *inv, item_id_t item, int amount);
bool inv_holding(const inventory_t *inv, item_id_t item);
inv_slot_t *inv_selected_slot(inventory_t *inv);
void inv_select_hotbar(inventory_t *inv, int index);
void inv_scroll_selection(inventory_t *inv, int delta);

#endif /* ECHO_INVENTORY_H */
`,
      },

      "include/entity.h": {
        type: "h",
        rev: "1.4",
        age: "2004-08-22",
        author: "hchen",
        log: "Player entity state machine, physics vectors, and inventory",
        content: `#ifndef ECHO_ENTITY_H
#define ECHO_ENTITY_H

#include "types.h"
#include "inventory.h"

typedef struct {
    vec2f_t position;
    vec2f_t velocity;
    direction_t facing;
    float walk_speed;
    float run_speed;
    float terrain_drag;
    float step_accumulator;
    bool movement_enabled;
    bool is_chopping;
    float swing_timer;
    bool is_drowning;
    float sink_timer;
    inventory_t inv;
    uint32_t state_flags;
} player_t;

extern player_t g_player;

void player_init(player_t *p);
void player_handle_input(player_t *p, float move_x, float move_y, bool sprint, bool action_press);
void player_update(player_t *p, float dt);
void player_trigger_drown(player_t *p);
void player_respawn(player_t *p, vec2f_t checkpoint);

#endif /* ECHO_ENTITY_H */
`,
      },

      "include/portal.h": {
        type: "h",
        rev: "1.4",
        age: "2004-11-06",
        author: "vstrickland",
        log: "Declare portal verification interface",
        content: `#ifndef ECHO_PORTAL_H
#define ECHO_PORTAL_H

#include "types.h"

portal_status_t query_portal_state(void);
int verify_portal_seal(const char *key);

#endif
`,
      },

      "include/audio.h": {
        type: "h",
        rev: "1.3",
        age: "2004-09-08",
        author: "kmatsuda",
        log: "SoundBlaster DSP interface and carrier tone definitions",
        content: `#ifndef ECHO_AUDIO_H
#define ECHO_AUDIO_H

#include "types.h"

#define CARRIER_HERTZ 1420.405
#define AUDIO_CHANNELS 8

typedef enum {
    SFX_FOOTSTEP = 0,
    SFX_SWING,
    SFX_CHOP,
    SFX_SPLASH,
    SFX_CRUMBLE,
    SFX_GATE_UNLOCK,
    SFX_CARRIER_TONE
} sfx_id_t;

void sound_init(void);
void sound_play_sfx(sfx_id_t sfx);
void sound_play_ambient(int zone_id);
void sound_synthesize_carrier_buffer(float *buffer, int sample_count, float sample_rate);
void sound_shutdown(void);

#endif
`,
      },

      "src/core/main.c": {
        type: "c",
        rev: "1.5",
        age: "2004-10-18",
        author: "cvsadmin",
        log: "Implement CLI argument parser, fixed delta game loop, and subsystem boot",
        content: `/* =========================================================================
 * src/core/main.c — Engine Entrypoint & Subsystem Orchestrator
 * Project: echo (C99 / SDL Runtime Engine)
 * ========================================================================= */

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include "types.h"
#include "world.h"
#include "entity.h"
#include "clock.h"
#include "flags.h"
#include "audio.h"

static bool g_running = true;

static void print_banner(void) {
    printf("=====================================================\\n");
    printf("  echo Engine v0.4.2 [Build: 2004-10-18 (GCC 3.3.4)] \\n");
    printf("  Target: i686-pc-linux-gnu / SDL 1.2 / SoundBlaster  \\n");
    printf("=====================================================\\n");
}

int main(int argc, char *argv[]) {
    print_banner();

    /* 1. Core Services Initialization */
    flags_init();
    clock_init();
    sound_init();
    world_init();
    player_init(&g_player);

    /* 2. Command Line Arguments Evaluation */
    world_zone_t start_zone = ZONE_LEVEL1_GRASSLANDS;
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--level2") == 0) start_zone = ZONE_LEVEL2_LAGOON;
        else if (strcmp(argv[i], "--level3") == 0) start_zone = ZONE_LEVEL3_GROVE;
        else if (strcmp(argv[i], "--level4") == 0) start_zone = ZONE_LEVEL4_PORTAL;
        else if (strcmp(argv[i], "--test-carrier") == 0) {
            printf("[main] Testing carrier frequency synthesis...\\n");
            sound_play_sfx(SFX_CARRIER_TONE);
        }
    }

    world_load_zone(start_zone);
    printf("[main] System ready. Entering main execution loop at 60 Hz.\\n");

    /* 3. Fixed Delta Tick Simulation (16.66ms per step) */
    const float dt = 0.01667f;
    int tick_count = 0;
    while (g_running && tick_count < 300) {
        clock_tick(dt);
        player_update(&g_player, dt);
        tick_count++;
    }

    printf("[main] Execution halted cleanly after %d engine ticks.\\n", tick_count);
    sound_shutdown();
    return 0;
}
`,
      },

      "src/core/engine.c": {
        type: "c",
        rev: "1.4",
        age: "2004-10-12",
        author: "kmatsuda",
        log: "Implement camera tracking lerp with viewport boundary clamping",
        content: `/* =========================================================================
 * src/core/engine.c — Game State Loop & Viewport Camera Tracker
 * Project: echo (Replicates camera_bounds.gd and game_world.gd)
 * ========================================================================= */

#include "types.h"
#include "world.h"
#include "entity.h"
#include "clock.h"
#include "flags.h"
#include <stdio.h>

typedef enum {
    STATE_TITLE,
    STATE_OVERWORLD,
    STATE_DIALOGUE,
    STATE_PAUSED
} engine_state_t;

static engine_state_t g_state = STATE_OVERWORLD;
static vec2f_t g_camera_pos = { 0.0f, 0.0f };

int engine_init(void) {
    printf("[engine] Display initialized (640x480 native, 2x scaler enabled)\\n");
    printf("[engine] Subsystem allocated: VRAM 16MB, Double-Buffer ready\\n");
    g_state = STATE_OVERWORLD;
    return 0;
}

void engine_update_camera(const player_t *player, float lerp_weight) {
    /* Camera smoothly follows player position clamped to level boundaries */
    float target_x = player->position.x - (SCREEN_WIDTH / 2.0f);
    float target_y = player->position.y - (SCREEN_HEIGHT / 2.0f);

    float max_x = (float)(MAP_WIDTH * TILE_SIZE - SCREEN_WIDTH);
    float max_y = (float)(MAP_HEIGHT * TILE_SIZE - SCREEN_HEIGHT);

    if (target_x < 0.0f) target_x = 0.0f;
    if (target_x > max_x) target_x = max_x;
    if (target_y < 0.0f) target_y = 0.0f;
    if (target_y > max_y) target_y = max_y;

    g_camera_pos.x += (target_x - g_camera_pos.x) * lerp_weight;
    g_camera_pos.y += (target_y - g_camera_pos.y) * lerp_weight;
}

void engine_run(void) {
    printf("[engine] Processing overworld tick... State: %d\\n", g_state);
    engine_update_camera(&g_player, 0.12f);
}

void engine_shutdown(void) {
    printf("[engine] Subsystem unloaded. Framebuffer discarded.\\n");
}
`,
      },

      "src/core/clock.c": {
        type: "c",
        rev: "1.3",
        age: "2004-09-24",
        author: "kmatsuda",
        log: "Implement 8-point daylight tint keyframe interpolation and phase transitions",
        content: `/* =========================================================================
 * src/core/clock.c — Day-Night Cycle & Lighting Modulation Service
 * Project: echo (Replicates project-echo-game/core/clock.gd)
 * ========================================================================= */

#include "clock.h"
#include <stdio.h>

clock_system_t g_clock;

/* 8-point lighting table matching clock.gd LIGHT array */
typedef struct {
    float hour;
    rgb_color_t tint;
} light_keyframe_t;

static const light_keyframe_t LIGHT_KEYS[8] = {
    {  5.0f, { 0.20f, 0.22f, 0.40f } }, /* Last of the night */
    {  6.5f, { 0.92f, 0.74f, 0.62f } }, /* Dawn */
    {  8.5f, { 1.00f, 0.97f, 0.90f } }, /* Morning */
    { 12.0f, { 1.00f, 1.00f, 1.00f } }, /* Noon */
    { 16.0f, { 1.00f, 0.96f, 0.88f } }, /* Late afternoon */
    { 18.5f, { 1.00f, 0.72f, 0.50f } }, /* Evening */
    { 20.5f, { 0.50f, 0.40f, 0.60f } }, /* Dusk */
    { 22.0f, { 0.20f, 0.22f, 0.40f } }  /* Night */
};

void clock_init(void) {
    g_clock.day = 1;
    g_clock.hour = WAKE_HOUR;
    g_clock.running = true;
    g_clock.phase = PHASE_MORNING;
    g_clock.sky_count = 1;
    g_clock.current_tint = (rgb_color_t){ 1.0f, 0.97f, 0.90f };
    printf("[clock] Initialized at Day %d, Hour %.1f:00 (Phase: Morning)\\n", g_clock.day, g_clock.hour);
}

void clock_tick(float dt) {
    if (!g_clock.running) return;

    /* Advance fractional hour based on 16-minute full day */
    float hour_delta = (dt / DAY_SECONDS) * 24.0f;
    g_clock.hour += hour_delta;

    if (g_clock.hour >= 24.0f) {
        g_clock.hour -= 24.0f;
        g_clock.day++;
        printf("[clock] Day transition: now Day %d\\n", g_clock.day);
    }

    /* Evaluate Phase */
    if (g_clock.hour >= 6.0f && g_clock.hour < 12.0f) {
        g_clock.phase = PHASE_MORNING;
    } else if (g_clock.hour >= 12.0f && g_clock.hour < 18.0f) {
        g_clock.phase = PHASE_AFTERNOON;
    } else if (g_clock.hour >= 18.0f && g_clock.hour < 21.0f) {
        g_clock.phase = PHASE_EVENING;
    } else {
        g_clock.phase = PHASE_NIGHT;
    }

    /* Compute lerped lighting tint */
    g_clock.current_tint = clock_get_ambient_tint();
}

void clock_sleep_until_morning(void) {
    g_clock.day++;
    g_clock.hour = WAKE_HOUR;
    g_clock.phase = PHASE_MORNING;
    g_clock.current_tint = (rgb_color_t){ 1.00f, 0.97f, 0.90f };
    printf("[clock] Player slept. Awakening on Day %d at 07:00 AM.\\n", g_clock.day);
}

day_phase_t clock_get_phase(void) {
    return g_clock.phase;
}

rgb_color_t clock_get_ambient_tint(void) {
    float h = g_clock.hour;
    for (int i = 0; i < 7; i++) {
        if (h >= LIGHT_KEYS[i].hour && h <= LIGHT_KEYS[i + 1].hour) {
            float t = (h - LIGHT_KEYS[i].hour) / (LIGHT_KEYS[i + 1].hour - LIGHT_KEYS[i].hour);
            rgb_color_t result;
            result.r = LIGHT_KEYS[i].tint.r + t * (LIGHT_KEYS[i + 1].tint.r - LIGHT_KEYS[i].tint.r);
            result.g = LIGHT_KEYS[i].tint.g + t * (LIGHT_KEYS[i + 1].tint.g - LIGHT_KEYS[i].tint.g);
            result.b = LIGHT_KEYS[i].tint.b + t * (LIGHT_KEYS[i + 1].tint.b - LIGHT_KEYS[i].tint.b);
            return result;
        }
    }
    return LIGHT_KEYS[7].tint; /* Deep night fallback */
}
`,
      },

      "src/core/flags.c": {
        type: "c",
        rev: "1.3",
        age: "2004-07-28",
        author: "hchen",
        log: "Implement key-value world state flag storage with persistence shims",
        content: `/* =========================================================================
 * src/core/flags.c — World State Persistence & Story Progression Flags
 * Project: echo (Replicates project-echo-game/core/flags.gd)
 * ========================================================================= */

#include "flags.h"
#include <string.h>
#include <stdio.h>

static flag_entry_t g_flags[MAX_FLAGS];
static int g_flag_count = 0;

void flags_init(void) {
    g_flag_count = 0;
    memset(g_flags, 0, sizeof(g_flags));
    printf("[flags] World state flags table initialized (Capacity: %d)\\n", MAX_FLAGS);
}

bool flags_has(const char *key) {
    if (!key) return false;
    for (int i = 0; i < g_flag_count; i++) {
        if (strcmp(g_flags[i].key, key) == 0) {
            return g_flags[i].value;
        }
    }
    return false;
}

void flags_set(const char *key, bool value) {
    if (!key || strlen(key) >= MAX_FLAG_KEY_LEN) return;

    for (int i = 0; i < g_flag_count; i++) {
        if (strcmp(g_flags[i].key, key) == 0) {
            if (g_flags[i].value != value) {
                g_flags[i].value = value;
                printf("[flags] Flag updated: '%s' = %s\\n", key, value ? "true" : "false");
            }
            return;
        }
    }

    if (g_flag_count < MAX_FLAGS && value) {
        strncpy(g_flags[g_flag_count].key, key, MAX_FLAG_KEY_LEN - 1);
        g_flags[g_flag_count].value = true;
        g_flag_count++;
        printf("[flags] Flag registered: '%s' = true (Total: %d)\\n", key, g_flag_count);
    }
}

void flags_unset(const char *key) {
    flags_set(key, false);
}

int flags_count(void) {
    return g_flag_count;
}

void flags_clear(void) {
    g_flag_count = 0;
    memset(g_flags, 0, sizeof(g_flags));
}
`,
      },

      "src/core/save_system.c": {
        type: "c",
        rev: "1.4",
        age: "2004-09-02",
        author: "vstrickland",
        log: "ConfigFile save system matching save_game.gd user://save.cfg format",
        content: `/* =========================================================================
 * src/core/save_system.c — ConfigFile Save Service (user://save.cfg)
 * Project: echo (Replicates project-echo-game/core/save_game.gd)
 * ========================================================================= */

#include "entity.h"
#include "flags.h"
#include "clock.h"
#include <stdio.h>
#include <string.h>

#define SAVE_PATH "user://save.cfg"
#define SAVE_VERSION 1

bool can_save(const player_t *p) {
    return p != NULL && p->movement_enabled && !p->is_drowning;
}

int save_progress(const char *user_id, uint32_t flags) {
    char path[128];
    snprintf(path, sizeof(path), "user://%s_save.cfg", user_id);
    FILE *f = fopen(path, "w");
    if (!f) return -1;

    fprintf(f, "[meta]\\nversion=%d\\n", SAVE_VERSION);
    fprintf(f, "[where]\\npos_x=%.2f\\npos_y=%.2f\\nfacing=%d\\n",
            g_player.position.x, g_player.position.y, g_player.facing);
    fprintf(f, "[clock]\\nday=%d\\nhour=%.2f\\n", g_clock.day, g_clock.hour);
    fprintf(f, "[inventory]\\nselected_hotbar=%d\\n", g_player.inv.selected);
    fprintf(f, "[progress]\\nflags=%u\\nflag_count=%d\\n", flags, flags_count());

    fclose(f);
    printf("[save_system] Progress saved to %s\\n", path);
    return 0;
}
`,
      },

      "src/core/security.c": {
        type: "c",
        rev: "1.3",
        age: "2004-10-04",
        author: "cvsadmin",
        log: "Implement CRC32 validation, memory tamper detection, and polynomial table",
        content: `/* =========================================================================
 * src/core/security.c — Sector CRC32 & Memory Parity Verification
 * Project: echo
 * ========================================================================= */

#include <stdint.h>
#include <stdio.h>
#include <stdbool.h>

#define CRC32_POLYNOMIAL 0xEDB88320

uint32_t calculate_sector_crc(const uint8_t *data, size_t len) {
    uint32_t crc = 0xFFFFFFFF;
    for (size_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            crc = (crc >> 1) ^ (CRC32_POLYNOMIAL & (-(crc & 1)));
        }
    }
    return ~crc;
}

bool verify_sector_integrity(uint32_t sector_address, const uint8_t *data, size_t len, uint32_t expected_crc) {
    uint32_t actual = calculate_sector_crc(data, len);
    if (actual != expected_crc) {
        printf("[security] CRITICAL: Parity fault at Sector 0x%04X (Expected: 0x%08X, Got: 0x%08X)\\n",
               sector_address, expected_crc, actual);
        return false;
    }
    return true;
}
`,
      },

      "src/entities/inventory.c": {
        type: "c",
        rev: "1.4",
        age: "2004-08-20",
        author: "hchen",
        log: "Implement 4-slot hotbar, item stacking, and holding gate checks",
        content: `/* =========================================================================
 * src/entities/inventory.c — Hotbar & Bag Slot Management
 * Project: echo (Replicates project-echo-game/inventory/inventory.gd)
 * ========================================================================= */

#include "inventory.h"
#include <string.h>
#include <stdio.h>

void inv_init(inventory_t *inv) {
    inv->selected = 0;
    for (int i = 0; i < INV_CAPACITY; i++) {
        inv->slots[i].id = ITEM_NONE;
        inv->slots[i].amount = 0;
        inv->slots[i].max_stack = 1;
        inv->slots[i].name[0] = '\\0';
    }
    printf("[inventory] Inventory initialized (%d total slots, %d hotbar)\\n",
           INV_CAPACITY, HOTBAR_SIZE);
}

bool inv_insert(inventory_t *inv, item_id_t item, int amount, const char *name, int max_stack) {
    if (!inv || item == ITEM_NONE || amount <= 0) return false;

    /* 1. Try stacking into existing non-full slot */
    if (max_stack > 1) {
        for (int i = 0; i < INV_CAPACITY; i++) {
            if (inv->slots[i].id == item && inv->slots[i].amount < inv->slots[i].max_stack) {
                int space = inv->slots[i].max_stack - inv->slots[i].amount;
                int to_add = (amount < space) ? amount : space;
                inv->slots[i].amount += to_add;
                amount -= to_add;
                if (amount == 0) return true;
            }
        }
    }

    /* 2. Find first empty slot (hotbar preferred first) */
    for (int i = 0; i < INV_CAPACITY; i++) {
        if (inv->slots[i].id == ITEM_NONE || inv->slots[i].amount == 0) {
            inv->slots[i].id = item;
            inv->slots[i].amount = amount;
            inv->slots[i].max_stack = max_stack;
            strncpy(inv->slots[i].name, name, sizeof(inv->slots[i].name) - 1);
            printf("[inventory] Inserted %dx '%s' into slot %d\\n", amount, name, i);
            return true;
        }
    }

    printf("[inventory] Cannot insert '%s': inventory full!\\n", name);
    return false;
}

bool inv_remove(inventory_t *inv, item_id_t item, int amount) {
    if (!inv || !inv_has(inv, item, amount)) return false;

    int needed = amount;
    for (int i = INV_CAPACITY - 1; i >= 0; i--) {
        if (inv->slots[i].id == item) {
            if (inv->slots[i].amount <= needed) {
                needed -= inv->slots[i].amount;
                inv->slots[i].id = ITEM_NONE;
                inv->slots[i].amount = 0;
            } else {
                inv->slots[i].amount -= needed;
                needed = 0;
            }
            if (needed == 0) return true;
        }
    }
    return false;
}

bool inv_has(const inventory_t *inv, item_id_t item, int amount) {
    if (!inv) return false;
    int count = 0;
    for (int i = 0; i < INV_CAPACITY; i++) {
        if (inv->slots[i].id == item) {
            count += inv->slots[i].amount;
            if (count >= amount) return true;
        }
    }
    return false;
}

bool inv_holding(const inventory_t *inv, item_id_t item) {
    if (!inv || inv->selected < 0 || inv->selected >= HOTBAR_SIZE) return false;
    return inv->slots[inv->selected].id == item && inv->slots[inv->selected].amount > 0;
}

inv_slot_t *inv_selected_slot(inventory_t *inv) {
    if (!inv || inv->selected < 0 || inv->selected >= HOTBAR_SIZE) return NULL;
    return &inv->slots[inv->selected];
}

void inv_select_hotbar(inventory_t *inv, int index) {
    if (!inv) return;
    if (index >= 0 && index < HOTBAR_SIZE) {
        inv->selected = index;
    }
}

void inv_scroll_selection(inventory_t *inv, int delta) {
    if (!inv) return;
    inv->selected = (inv->selected + delta + HOTBAR_SIZE) % HOTBAR_SIZE;
}
`,
      },

      "src/entities/player.c": {
        type: "c",
        rev: "1.5",
        age: "2004-09-14",
        author: "kmatsuda",
        log: "Implement player physics, terrain drag, axe swing action, and drowning FSM",
        content: `/* =========================================================================
 * src/entities/player.c — Josh Player Controller, Physics & Action FSM
 * Project: echo (Replicates project-echo-game/character/player_josh.gd)
 * ========================================================================= */

#include "entity.h"
#include "world.h"
#include "audio.h"
#include <stdio.h>
#include <math.h>

player_t g_player;

void player_init(player_t *p) {
    p->position = (vec2f_t){ 100.0f, 150.0f };
    p->velocity = (vec2f_t){ 0.0f, 0.0f };
    p->facing = DIR_DOWN;
    p->walk_speed = 100.0f;
    p->run_speed = 200.0f;
    p->terrain_drag = 1.0f;
    p->step_accumulator = 0.0f;
    p->movement_enabled = true;
    p->is_chopping = false;
    p->swing_timer = 0.0f;
    p->is_drowning = false;
    p->sink_timer = 0.0f;
    p->state_flags = 0;

    inv_init(&p->inv);
    /* Initial items matching starter configuration */
    inv_insert(&p->inv, ITEM_PHOSPHOR_LAMP, 1, "Phosphor Lamp", 1);
    printf("[player] Josh initialized at (%.1f, %.1f)\\n", p->position.x, p->position.y);
}

void player_handle_input(player_t *p, float move_x, float move_y, bool sprint, bool action_press) {
    if (!p->movement_enabled || p->is_drowning) {
        p->velocity = (vec2f_t){ 0.0f, 0.0f };
        return;
    }

    /* 1. Calculate directional movement with normalization */
    float len = sqrtf(move_x * move_x + move_y * move_y);
    if (len > 0.0001f) {
        float speed = (sprint ? p->run_speed : p->walk_speed) * p->terrain_drag;
        p->velocity.x = (move_x / len) * speed;
        p->velocity.y = (move_y / len) * speed;

        /* Update facing orientation */
        if (fabsf(move_x) > fabsf(move_y)) {
            p->facing = (move_x > 0) ? DIR_RIGHT : DIR_LEFT;
        } else {
            p->facing = (move_y > 0) ? DIR_DOWN : DIR_UP;
        }
    } else {
        p->velocity = (vec2f_t){ 0.0f, 0.0f };
    }

    /* 2. Tool action (chopping trees / interacting) */
    if (action_press && !p->is_chopping) {
        if (inv_holding(&p->inv, ITEM_IRON_AXE)) {
            p->is_chopping = true;
            p->swing_timer = 0.25f;
            sound_play_sfx(SFX_SWING);
            printf("[player] Swinging iron axe facing direction %d\\n", p->facing);
        }
    }
}

void player_update(player_t *p, float dt) {
    /* Handle drowning recovery state */
    if (p->is_drowning) {
        p->sink_timer -= dt;
        if (p->sink_timer <= 0.0f) {
            player_respawn(p, (vec2f_t){ 100.0f, 150.0f });
        }
        return;
    }

    /* Handle axe chopping animation cooldown */
    if (p->is_chopping) {
        p->swing_timer -= dt;
        if (p->swing_timer <= 0.0f) {
            p->is_chopping = false;
        }
    }

    /* Movement and terrain integration */
    if (p->velocity.x != 0.0f || p->velocity.y != 0.0f) {
        vec2f_t next_pos = {
            p->position.x + p->velocity.x * dt,
            p->position.y + p->velocity.y * dt
        };

        int tile_x = (int)(next_pos.x / TILE_SIZE);
        int tile_y = (int)(next_pos.y / TILE_SIZE);

        /* Evaluate terrain properties */
        p->terrain_drag = world_get_terrain_drag(tile_x, tile_y);
        tile_type_t t = world_get_tile(tile_x, tile_y);

        if (t == TILE_WATER) {
            player_trigger_drown(p);
            return;
        }

        if (!world_is_solid(tile_x, tile_y)) {
            p->position = next_pos;
        }

        /* Step distance sound trigger (30.0 px distance) */
        float dist = sqrtf(p->velocity.x * p->velocity.x + p->velocity.y * p->velocity.y) * dt;
        p->step_accumulator += dist;
        if (p->step_accumulator >= 30.0f) {
            p->step_accumulator = 0.0f;
            sound_play_sfx(SFX_FOOTSTEP);
        }
    }
}

void player_trigger_drown(player_t *p) {
    p->is_drowning = true;
    p->movement_enabled = false;
    p->sink_timer = 0.6f;
    sound_play_sfx(SFX_SPLASH);
    printf("[player] Josh fell into water currents! Drowning countdown started.\\n");
}

void player_respawn(player_t *p, vec2f_t checkpoint) {
    p->position = checkpoint;
    p->velocity = (vec2f_t){ 0.0f, 0.0f };
    p->is_drowning = false;
    p->movement_enabled = true;
    p->terrain_drag = 1.0f;
    printf("[player] Josh respawned at safe ground (%.1f, %.1f)\\n", checkpoint.x, checkpoint.y);
}
`,
      },

      "src/entities/blacksmith.c": {
        type: "c",
        rev: "1.4",
        age: "2004-08-25",
        author: "hchen",
        log: "Implement 3-fish trade barter system for Iron Axe matching greet.dialogue",
        content: `/* =========================================================================
 * src/entities/blacksmith.c — NPC Trading & Quest Dialogue Service
 * Project: echo (Replicates project-echo-game/dialogue/greet.dialogue)
 * ========================================================================= */

#include "entity.h"
#include "flags.h"
#include "audio.h"
#include <stdio.h>

#define FLAG_AXE_GIVEN "blacksmith.axe_given"
#define REQUIRED_FISH_COUNT 3

void blacksmith_interact(player_t *player) {
    if (!player) return;

    if (flags_has(FLAG_AXE_GIVEN)) {
        printf("[Blacksmith]: 'The old road through the grove is shut. Has been for years.'\\n");
        printf("[Blacksmith]: 'Watch yourself near the monolith at (2003, 502).'\\n");
        return;
    }

    /* Check if player brought the 3 fish */
    if (inv_has(&player->inv, ITEM_LAGOON_FISH, REQUIRED_FISH_COUNT)) {
        inv_remove(&player->inv, ITEM_LAGOON_FISH, REQUIRED_FISH_COUNT);
        inv_insert(&player->inv, ITEM_IRON_AXE, 1, "Iron Axe", 1);
        flags_set(FLAG_AXE_GIVEN, true);
        sound_play_sfx(SFX_GATE_UNLOCK);
        printf("[Blacksmith]: 'Three fresh ones from the lagoon. A deal is a deal.'\\n");
        printf("[Blacksmith]: 'Here's the old axe. It'll bite clean through those maple trunks.'\\n");
    } else {
        printf("[Blacksmith]: 'Can't work the forge without timber, and the trees won't cut themselves.'\\n");
        printf("[Blacksmith]: 'Bring me 3 fish from the lagoon, and my spare axe is yours.'\\n");
    }
}
`,
      },

      "src/entities/dialogue.c": {
        type: "c",
        rev: "1.4",
        age: "2004-06-30",
        author: "hchen",
        log: "Expose recovered dead-code string HAVEN_ENTRY_GRANTED and dialogue node table",
        content: `/* =========================================================================
 * src/entities/dialogue.c — Dialogue Tree Dispatcher & Condition Evaluator
 * Project: echo
 * ========================================================================= */

#include "flags.h"
#include <stdio.h>
#include <string.h>
#include <stdint.h>

/* Recovered dead-code dialogue dispatcher.
 * Matches findings in Research Session RS-028:
 * The string is never spoken by NPCs, but exists in uncalled branches. */

typedef struct {
    const char *tag;
    const char *text;
    uint32_t prerequisite_mask;
} dialogue_node_t;

static const dialogue_node_t DIALOGUE_NODES[] = {
    { "greet_blacksmith", "The grove road is shut. Has been since before the towers fell.", 0x01 },
    { "cliffside_look",   "The wind off the bay is cold enough to freeze grease in the pan.", 0x02 },
    { "grove_pedestal",   "Four stones carved with sunken sockets. Blue, red, green, purple.", 0x04 },
    { "void_threshold",   "Beyond this point, the grass turns white and compass needles spin.", 0x08 },
    { "haven_secret",     "HAVEN_ENTRY_GRANTED", 0x80000000 } /* Unreachable clue branch */
};

void dialogue_trigger(const char *tag, uint32_t flags) {
    for (size_t i = 0; i < sizeof(DIALOGUE_NODES)/sizeof(DIALOGUE_NODES[0]); i++) {
        if (strcmp(DIALOGUE_NODES[i].tag, tag) == 0) {
            printf("[dialogue] <%s>: %s\\n", tag, DIALOGUE_NODES[i].text);
            return;
        }
    }
    printf("[dialogue] Node '%s' not found.\\n", tag);
}

void check_hidden_dialogue(uint32_t flags) {
    if (flags & 0x80000000) {
        printf("[dialogue_audit] EXPOSED RECOVERED STRING: HAVEN_ENTRY_GRANTED\\n");
    }
}
`,
      },

      "src/entities/shadow_dialogue.c": {
        type: "c",
        rev: "1.2",
        age: "2004-03-15",
        author: "hchen",
        log: "Recover orphaned NPC strings from sector 0x6E00",
        content: `/* =========================================================================
 * src/entities/shadow_dialogue.c — Anomalous NPC Memory Buffers
 * Project: echo (Recovered from Sector 0x6E00)
 * =========================================================================
 *
 * NOTE: These dialogue strings were not authored for any quest.
 * They reside in unreferenced memory blocks between the village tables.
 * Playtester log RS-031 noted: "The NPCs keep repeating lines about being recorded."
 * ========================================================================= */

#include <stdio.h>

static const char *ORPHAN_DIALOGUE_TABLE[] = {
    "Are you Josh, or are you the one who watches Josh?",
    "The researcher wrote about us in his little book. Did he tell you how to get out?",
    "The water in the lagoon doesn't flow down. It flows backward into the disk.",
    "Do not touch the fourth stone unless you know the word for when it stays.",
    "Sector 0x7F2A was never meant to be read by humans.",
    "When you enter the three words at the terminal, the door will not just open here."
};

void dump_shadow_memory(void) {
    for (int i = 0; i < 6; i++) {
        printf("[shadow_dialogue] [%d]: %s\\n", i, ORPHAN_DIALOGUE_TABLE[i]);
    }
}
`,
      },

      "src/world/level1_grasslands.c": {
        type: "c",
        rev: "1.4",
        age: "2004-08-30",
        author: "kmatsuda",
        log: "Implement tile blitter, tree felling mechanics, and monolith anchors X=2003, Y=502",
        content: `/* =========================================================================
 * src/world/level1_grasslands.c — Level 1 Overworld & Monolith Coordinates
 * Project: echo (Replicates base_grass_level_1.tscn / game_world.gd)
 * ========================================================================= */

#include "world.h"
#include "flags.h"
#include "audio.h"
#include <stdio.h>

/* Monolith coordinates match 2003-05-02 archive spreadsheet */
const int MONOLITH_X = 2003;
const int MONOLITH_Y = 502;

static map_grid_t g_level1_grid;

void load_level1_grass(void) {
    g_level1_grid.zone_id = ZONE_LEVEL1_GRASSLANDS;
    g_level1_grid.spawn_point = (vec2_t){ 100, 150 };
    g_level1_grid.monolith_pos = (vec2_t){ MONOLITH_X, MONOLITH_Y };

    /* Fill tilemap with grass, paths, and rivers */
    for (int y = 0; y < MAP_HEIGHT; y++) {
        for (int x = 0; x < MAP_WIDTH; x++) {
            if (x == 12 || y == 18) {
                g_level1_grid.tiles[y][x] = TILE_COBBLE;
            } else if (y > 90 && y < 100) {
                g_level1_grid.tiles[y][x] = TILE_WATER;
                g_level1_grid.collision[y][x] = 1;
            } else {
                g_level1_grid.tiles[y][x] = TILE_GRASS;
                g_level1_grid.collision[y][x] = 0;
            }
        }
    }

    printf("[level1] Grasslands loaded. Monolith boundary anchored at (%d, %d)\\n",
           MONOLITH_X, MONOLITH_Y);
}

bool level1_chop_tree(int tree_id, int axe_power) {
    char flag_key[64];
    snprintf(flag_key, sizeof(flag_key), "level1.tree_%d_felled", tree_id);

    if (flags_has(flag_key)) {
        printf("[level1] Tree #%d is already a stump.\\n", tree_id);
        return false;
    }

    sound_play_sfx(SFX_CHOP);
    flags_set(flag_key, true);
    printf("[level1] Maple tree #%d felled! Spawned 3x Maple Wood item.\\n", tree_id);
    return true;
}
`,
      },

      "src/world/level2_lagoon.c": {
        type: "c",
        rev: "1.5",
        age: "2004-07-25",
        author: "vstrickland",
        log: "Implement HAVEN_MAP_03 water current vectors and crumbling bridge decay timer",
        content: `/* =========================================================================
 * src/world/level2_lagoon.c — Haven Lagoon Currents & Crumble Bridges
 * Project: echo (Replicates game_level_2.gd & HAVEN_MAP_03.png)
 * ========================================================================= */

#include "world.h"
#include "audio.h"
#include <stdio.h>
#include <math.h>

#define CRUMBLE_MAX_INTEGRITY 3

typedef struct {
    vec2_t position;
    int integrity;
    bool collapsed;
    float timer;
} crumble_bridge_t;

static crumble_bridge_t g_bridge = { { 340, 280 }, CRUMBLE_MAX_INTEGRITY, false, 0.0f };

void compute_lagoon_currents(int x, int y, float *vx, float *vy) {
    /* Restored from HAVEN_MAP_03.png vector field */
    float rad = (float)(x + y) * 0.15f;
    *vx = sinf(rad) * 1.5f;
    *vy = cosf(rad) * 1.2f;
}

void level2_update_bridge(float dt, bool player_on_bridge) {
    if (g_bridge.collapsed) return;

    if (player_on_bridge) {
        g_bridge.timer += dt;
        if (g_bridge.timer >= 0.4f) {
            g_bridge.timer = 0.0f;
            g_bridge.integrity--;
            sound_play_sfx(SFX_CRUMBLE);
            printf("[level2] Crumble bridge cracked! Integrity: %d/3\\n", g_bridge.integrity);

            if (g_bridge.integrity <= 0) {
                g_bridge.collapsed = true;
                printf("[level2] Bridge collapsed into the lagoon! Fall zone activated.\\n");
            }
        }
    }
}
`,
      },

      "src/world/level3_grove.c": {
        type: "c",
        rev: "1.4",
        age: "2004-09-20",
        author: "vstrickland",
        log: "Implement gem pedestal puzzle sequence Blue->Red->Green->Purple from RS-034",
        content: `/* =========================================================================
 * src/world/level3_grove.c — Corrupted Grove & Gem Sequence Switchboard
 * Project: echo (Replicates game_level_3.gd ORDER sequence)
 * ========================================================================= */

#include "world.h"
#include "flags.h"
#include "audio.h"
#include <stdio.h>

#define FLAG_GROVE_GATE_OPEN "level3.gate_open"

/* Research Session RS-034 notes: Blue (0) -> Red (1) -> Green (2) -> Purple (3) */
static const int GROVE_CORRECT_ORDER[4] = { 0, 1, 2, 3 };
static int g_sequence_step = 0;

void level3_touch_pedestal(int gem_color) {
    if (flags_has(FLAG_GROVE_GATE_OPEN)) {
        printf("[level3] Grove gate is already unsealed. Pedestals hum gently.\\n");
        return;
    }

    if (gem_color == GROVE_CORRECT_ORDER[g_sequence_step]) {
        g_sequence_step++;
        printf("[level3] Pedestal %d activated! Sequence progress: %d/4\\n", gem_color, g_sequence_step);

        if (g_sequence_step == 4) {
            flags_set(FLAG_GROVE_GATE_OPEN, true);
            sound_play_sfx(SFX_GATE_UNLOCK);
            printf("[level3] BREAKTHROUGH: All four gems aligned! Grove gate swings open.\\n");
        }
    } else {
        printf("[level3] Wrong pedestal! The row darkens. Resetting sequence.\\n");
        g_sequence_step = 0;
        sound_play_sfx(SFX_CRUMBLE);
    }
}

int verify_generator_sequence(const int *switches, int count) {
    if (count != 4 || !switches) return 0;
    for (int i = 0; i < 4; i++) {
        if (switches[i] != GROVE_CORRECT_ORDER[i]) return 0;
    }
    return 1;
}
`,
      },

      "src/world/level4_pale_void.c": {
        type: "c",
        rev: "1.3",
        age: "2004-10-30",
        author: "vstrickland",
        log: "Carve Level 4 pale void stub from high-offset sectors (addresses 0x8A00-0x9200)",
        content: `/* =========================================================================
 * src/world/level4_pale_void.c — The Threshold (UNFINISHED / QUARANTINED)
 * Project: echo (Salvaged from Sector 0x8A00)
 * =========================================================================
 *
 * NOTE FROM CVSADMIN (2004-11-09):
 * DO NOT ATTEMPT TO COMPILE THIS FILE WITHOUT HARDWARE NETWORK ISOLATION.
 * When Josh crosses the threshold at tile (2003, 502), the renderer stops
 * drawing sprites and begins emitting raw packet telemetry.
 * ========================================================================= */

#include "world.h"
#include "portal.h"
#include "entity.h"
#include <stdio.h>
#include <string.h>

#define KEY_SECTOR_07    "WHN"                  /* Acquired from ASCII transmission */
#define KEY_HAVEN_LAGOON "K33P"                 /* Acquired from hidden dialogue / lagoon */
#define KEY_CARVED_ROOT  "echo_part2_0392"      /* Disassembled from Sector 0x7F2A */

static const vec2_t PALE_WAYPOINTS[] = {
    { 2003, 502 },  /* Monolith base */
    { 2003, 780 },  /* Boundary where music cuts out */
    { 2450, 990 },  /* The hollow log */
    { 3000, 1420 }, /* The Root Portal threshold */
};

void enter_pale_void(player_t *player) {
    printf("[VOID] Warning: Player crossed coordinate threshold X=%.1f Y=%.1f\\n",
           player->position.x, player->position.y);
    printf("[VOID] Ambient audio swapped to carrier wave 1420.405 Hz.\\n");

    /*
     * The game attempts to verify all three keys at the terminal console:
     * Format: KEY_SECTOR_07 + "_" + KEY_HAVEN_LAGOON + "_" + KEY_CARVED_ROOT
     * Result: WHN_K33P_echo_part2_0392
     */
}
`,
      },

      "src/world/portal.c": {
        type: "c",
        rev: "1.4",
        age: "3 months ago",
        author: "vstrickland",
        log: "[CRITICAL] Extract portal seal verification from damaged Sector 4 (echo_part2_0392)",
        isTarget: true,
        diff: `@@ -124,7 +124,18 @@
 portal_status_t check_portal_barrier(void) {
     return g_portal_locked ? SEAL_LOCKED : SEAL_UNLOCKED;
 }

-int verify_portal_seal(const char *key) {
-    /* TODO: Disassemble unreadable sector 0x7F2A */
-    return 0;
-}
+int verify_portal_seal(const char *key) {
+    /* =====================================================================
+     * RECOVERED ROUTINE: Disassembled from damaged Sector 0x7F2A
+     * Discovered by: vstrickland (2026-07-06)
+     *
+     * Research notes describe a 3-part sequence combining the broadcast code,
+     * the lagoon clue, and this third hardcoded sector override:
+     * ===================================================================== */
+    #define PORTAL_PASSCODE_P3 "echo_part2_0392"
+
+    if (key && strcmp(key, PORTAL_PASSCODE_P3) == 0) {
+        g_portal_locked = 0;
+        return 1; /* Unsealed */
+    }
+    return 0;
+}`,
        content: `/* =========================================================================
 * src/world/portal.c — Root Portal State Machine
 * Project: echo (Reconstructed from floppy sector 0x7F2A)
 * ========================================================================= */

#include "portal.h"
#include <string.h>

static int g_portal_locked = 1;

portal_status_t query_portal_state(void) {
    return g_portal_locked ? SEAL_LOCKED : SEAL_UNLOCKED;
}

int verify_portal_seal(const char *key) {
    /* =====================================================================
     * RECOVERED ROUTINE: Disassembled from damaged Sector 0x7F2A
     * Discovered by: vstrickland (2026-07-06)
     *
     * Research notes describe a 3-part sequence combining the broadcast code,
     * the lagoon clue, and this third hardcoded sector override:
     * ===================================================================== */
    #define PORTAL_PASSCODE_P3 "echo_part2_0392"

    if (key && strcmp(key, PORTAL_PASSCODE_P3) == 0) {
        g_portal_locked = 0;
        return 1; /* Unsealed */
    }
    return 0;
}
`,
      },

      "src/audio/sound_server.c": {
        type: "c",
        rev: "1.3",
        age: "2004-09-10",
        author: "kmatsuda",
        log: "Add SoundBlaster DSP synthesis drivers and 1420Hz carrier wave decoder",
        content: `/* =========================================================================
 * src/audio/sound_server.c — SoundBlaster 16 DSP & Carrier Wave Generator
 * Project: echo (Reconstructed audio subsystem)
 * ========================================================================= */

#include "audio.h"
#include <stdio.h>
#include <math.h>

const double CARRIER_FREQ_HZ = 1420.405;

void sound_init(void) {
    printf("[audio] SoundBlaster 16 DSP initialized at IRQ 5, DMA 1.\\n");
    printf("[audio] Carrier generator standby at %.3f Hz.\\n", CARRIER_FREQ_HZ);
}

void sound_play_sfx(sfx_id_t sfx) {
    static int footstep_index = 0;
    switch (sfx) {
        case SFX_FOOTSTEP:
            footstep_index = (footstep_index % 5) + 1;
            /* Cycled so repeated steps do not sound stamped, matching player_josh.gd */
            printf("[audio] SFX: footstep_%d.wav (vol: -14.0 dB)\\n", footstep_index);
            break;
        case SFX_SWING:
            printf("[audio] SFX: axe_swing_swoosh.wav\\n");
            break;
        case SFX_CHOP:
            printf("[audio] SFX: wood_chop_impact.wav\\n");
            break;
        case SFX_SPLASH:
            printf("[audio] SFX: water_splash.wav\\n");
            break;
        case SFX_CRUMBLE:
            printf("[audio] SFX: stone_bridge_rumble.wav\\n");
            break;
        case SFX_GATE_UNLOCK:
            printf("[audio] SFX: iron_lock_tumbler_open.wav\\n");
            break;
        case SFX_CARRIER_TONE:
            printf("[audio] CRITICAL: Emitting carrier wave %.3f Hz tone.\\n", CARRIER_FREQ_HZ);
            break;
    }
}

void sound_play_ambient(int zone_id) {
    switch (zone_id) {
        case 0:
            printf("[audio] Grasslands ambient: wind_loop_11k.wav\\n");
            break;
        case 1:
            printf("[audio] Haven Lagoon: water_submerged_lpf.wav\\n");
            break;
        case 2:
            printf("[audio] Corrupted Grove: distorted_chimes_reverse.wav\\n");
            break;
        case 3:
            printf("[audio] Threshold: Continuous carrier tone %.3f Hz.\\n", CARRIER_FREQ_HZ);
            break;
    }
}

void sound_synthesize_carrier_buffer(float *buffer, int sample_count, float sample_rate) {
    if (!buffer || sample_rate <= 0.0f) return;
    for (int i = 0; i < sample_count; i++) {
        buffer[i] = sinf(2.0f * 3.14159265f * (float)CARRIER_FREQ_HZ * (float)i / sample_rate);
    }
}

void sound_shutdown(void) {
    printf("[audio] SoundBlaster DSP unloaded.\\n");
}
`,
      },

      "src/gfx/palette.c": {
        type: "c",
        rev: "1.2",
        age: "2004-06-18",
        author: "hchen",
        log: "Extract VGA 256-color palette tables & CRT phosphor green registers",
        content: `/* =========================================================================
 * src/gfx/palette.c — VGA 256-Color Palette Table & Phosphor Calibration
 * Project: echo (Salvaged from Sector 0xAD00)
 * ========================================================================= */

#include <stdint.h>
#include <stdio.h>

const uint8_t PALETTE_VOID_PHOSPHOR[3] = { 0x00, 0xFF, 0x96 }; /* RGB #00FF96 */

typedef struct {
    uint8_t r, g, b;
} vga_color_t;

static vga_color_t g_vga_palette[256];

void palette_init(void) {
    g_vga_palette[0] = (vga_color_t){ 16, 16, 20 };
    g_vga_palette[1] = (vga_color_t){ 0, 255, 150 };
    g_vga_palette[2] = (vga_color_t){ 234, 108, 0 };
    g_vga_palette[3] = (vga_color_t){ 56, 189, 248 };
    g_vga_palette[4] = (vga_color_t){ 30, 58, 138 };
    g_vga_palette[5] = (vga_color_t){ 180, 83, 9 };

    printf("[gfx] VGA DAC palette loaded (256 color registers configured).\\n");
}
`,
      },

      "tools/decompiler/sector_dump.py": {
        type: "py",
        rev: "1.3",
        age: "2004-05-12",
        author: "kmatsuda",
        log: "Add hex carving script for damaged FAT12 floppy sectors",
        content: `#!/usr/bin/env python3
"""
tools/decompiler/sector_dump.py — Floppy Sector Stream Extractor
Carves contiguous C strings and binary assets from damaged 1.44MB floppy images.
"""

import sys

SECTOR_SIZE = 512

def scan_sector(filename, offset, length):
    with open(filename, 'rb') as f:
        f.seek(offset)
        chunk = f.read(length)
    print(f"[+] Scanned {length} bytes from offset 0x{offset:X}")
    return chunk

def find_ascii_strings(chunk, min_len=4):
    strings = []
    current = bytearray()
    for b in chunk:
        if 32 <= b <= 126:
            current.append(b)
        else:
            if len(current) >= min_len:
                strings.append(current.decode('latin1', errors='ignore'))
            current = bytearray()
    return strings

if __name__ == '__main__':
    print("[*] Sector carver initialized. Monitoring track offsets...")
`,
      },

      "tools/decompiler/hex_carver.c": {
        type: "c",
        rev: "1.2",
        age: "2004-05-20",
        author: "vstrickland",
        log: "Fast C binary string carver with CRC polynomial table",
        content: `/* =========================================================================
 * tools/decompiler/hex_carver.c — Fast C Binary String Carver
 * ========================================================================= */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

#define CRC_POLY 0xEDB88320

int main(int argc, char *argv[]) {
    printf("[hex_carver] Initialized with polynomial 0x%08X.\\n", CRC_POLY);
    printf("[hex_carver] Ready to scan raw binary floppy image dump.\\n");
    return 0;
}
`,
      },

      "tools/network/beacon_monitor.py": {
        type: "py",
        rev: "1.1",
        age: "2004-11-08",
        author: "dcorvin",
        log: "WARNING: Packet sniffer output during portal trigger test",
        content: `#!/usr/bin/env python3
"""
tools/network/beacon_monitor.py — Packet Sniffer for echo Game Runtime
Captured during developer dcorvin's test run on 2004-11-08 21:12 UTC.
"""

import sys

TARGET_PORT = 1420
ANOMALY_DESTINATION = "http://echoarchive5j7x2k.onion"

def analyze_packet_dump():
    print("[*] Loading packet capture 'pcap_echo_20041108_2112.log'...")
    print("[+] Packet #001: TCP SYN -> 127.0.0.1:1420 [ESTABLISHED]")
    print("[+] Packet #002: OUTBOUND SOCKS5 PROXY REQUEST")
    print(f"[!] DESTINATION: {ANOMALY_DESTINATION}")
    print("[!] PAYLOAD SIGNATURE: 'ECHO_CARRIER_HANDSHAKE_READY'")
    print("[!] ALERT: Process attempted connection outside sandbox.")
    print("[!] ACTION: Network interface dropped by cvsadmin.")

if __name__ == '__main__':
    analyze_packet_dump()
`,
      },
    },
  };

  // Web Audio Context for authentic retro key clicks
  let audioCtx = null;
  function playClick(freq = 600, duration = 0.015) {
    if (!REPO_DATA.soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // AudioContext unavailable or restricted
    }
  }

  // Hex Dump Formatter
  function formatHexDump(str) {
    const bytes = new TextEncoder().encode(str);
    const lines = [];
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16);
      const offsetHex = i.toString(16).padStart(8, "0");
      const hexParts = [];
      const asciiParts = [];
      for (let j = 0; j < 16; j++) {
        if (j < chunk.length) {
          const b = chunk[j];
          hexParts.push(b.toString(16).padStart(2, "0"));
          asciiParts.push(b >= 32 && b <= 126 ? String.fromCharCode(b) : ".");
        } else {
          hexParts.push("  ");
          asciiParts.push(" ");
        }
        if (j === 7) hexParts.push(""); // gap after 8 bytes
      }
      lines.push(`${offsetHex}  ${hexParts.join(" ")}  |${asciiParts.join("")}|`);
    }
    return lines.join("\n");
  }

  // Helper functions
  function getEffectiveUserId() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserId = urlParams.get("userId");
    const injected =
      window.USER_ID && window.USER_ID !== "{{USER_ID}}" ? window.USER_ID : null;
    const stored =
      localStorage.getItem("wordsearch_userId") ||
      localStorage.getItem("asciiart_userId") ||
      localStorage.getItem("echo_userId");
    const id = urlUserId || injected || stored || "guest";
    if (id && id !== "guest") {
      localStorage.setItem("echo_userId", id);
    }
    return id;
  }

  function getApiBaseUrl() {
    return window.API_BASE_URL && window.API_BASE_URL !== "{{API_BASE_URL}}"
      ? window.API_BASE_URL
      : "/v1/api";
  }

  function notifyStepCompletion(userId) {
    if (!userId || userId === "guest") return;
    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/puzzle/echo/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId,
        stepId: "step_15_git_commit",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        showToast("Clue Saved: Passcode Part 3 (echo_part2_0392) recorded to state.");
      })
      .catch((err) => {
        console.debug("State service completion notice:", err);
      });
  }

  function showToast(message) {
    const toast = document.getElementById("toastNotice");
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 4500);
  }

  // Navigation and Rendering
  function renderBreadcrumbs() {
    const bc = document.getElementById("repoBreadcrumbs");
    if (!bc) return;

    const parts = REPO_DATA.currentPath.split("/").filter(Boolean);
    let html = `<a href="javascript:void(0)" onclick="window.echoRepo.navigate('/')"><strong>[echo]</strong></a>`;
    let accum = "";
    for (let i = 0; i < parts.length; i++) {
      accum += "/" + parts[i];
      const p = accum;
      html += ` / <a href="javascript:void(0)" onclick="window.echoRepo.navigate('${p}')">${parts[i]}</a>`;
    }
    bc.innerHTML = html;
  }

  function renderFileList() {
    const tbody = document.getElementById("cvsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const current = REPO_DATA.currentPath === "/" ? "" : REPO_DATA.currentPath.slice(1);
    const dirs = new Set();
    const filesInDir = [];
    const query = REPO_DATA.filterQuery.trim().toLowerCase();

    for (const [filePath, meta] of Object.entries(REPO_DATA.files)) {
      if (query) {
        if (filePath.toLowerCase().includes(query) || meta.log.toLowerCase().includes(query)) {
          filesInDir.push({ name: filePath, path: filePath, ...meta });
        }
        continue;
      }

      if (current === "") {
        if (filePath.includes("/")) {
          dirs.add(filePath.split("/")[0]);
        } else {
          filesInDir.push({ name: filePath, path: filePath, ...meta });
        }
      } else {
        if (filePath.startsWith(current + "/")) {
          const remainder = filePath.slice(current.length + 1);
          if (remainder.includes("/")) {
            dirs.add(remainder.split("/")[0]);
          } else {
            filesInDir.push({ name: remainder, path: filePath, ...meta });
          }
        }
      }
    }

    if (!query && REPO_DATA.currentPath !== "/") {
      const parentParts = REPO_DATA.currentPath.split("/").filter(Boolean);
      parentParts.pop();
      const parentPath = "/" + parentParts.join("/");
      const tr = document.createElement("tr");
      tr.className = "clickable";
      tr.onclick = () => window.echoRepo.navigate(parentPath);
      tr.innerHTML = `
        <td colspan="5">
          <span class="file-icon icon-dir">[DIR]</span>
          <a href="javascript:void(0)">.. (Parent Directory)</a>
        </td>
      `;
      tbody.appendChild(tr);
    }

    if (!query) {
      for (const dirName of Array.from(dirs).sort()) {
        const fullDir = (current === "" ? "/" : "/" + current + "/") + dirName;
        const tr = document.createElement("tr");
        tr.className = "clickable";
        tr.onclick = () => window.echoRepo.navigate(fullDir);
        tr.innerHTML = `
          <td><span class="file-icon icon-dir">[DIR]</span> <a href="javascript:void(0)"><strong>${dirName}/</strong></a></td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td class="log-summary">Directory</td>
        `;
        tbody.appendChild(tr);
      }
    }

    filesInDir.sort((a, b) => a.name.localeCompare(b.name));
    for (const file of filesInDir) {
      const tr = document.createElement("tr");
      if (file.isTarget) {
        tr.className = "clickable cvs-target-row";
      } else {
        tr.className = "clickable";
      }

      let iconClass = "icon-doc";
      let iconLabel = "[TXT]";
      if (file.type === "c") {
        iconClass = "icon-c";
        iconLabel = "[C]";
      } else if (file.type === "h") {
        iconClass = "icon-h";
        iconLabel = "[H]";
      } else if (file.type === "py") {
        iconClass = "icon-py";
        iconLabel = "[PY]";
      }

      tr.innerHTML = `
        <td>
          <span class="file-icon ${iconClass}">${iconLabel}</span>
          <a href="javascript:void(0)" onclick="window.echoRepo.viewFile('${file.path}')">${file.name}</a>
          ${file.hasDiff ? `<a href="javascript:void(0)" onclick="window.echoRepo.openDiff('${file.path}'); event.stopPropagation();" style="margin-left:8px; font-size:10px; color:#ea6c00;">[diff]</a>` : ""}
        </td>
        <td><a href="javascript:void(0)" class="rev-badge" onclick="window.echoRepo.viewFile('${file.path}')">${file.rev}</a></td>
        <td style="color:#64748b;">${file.age}</td>
        <td class="author-tag">${file.author}</td>
        <td class="log-summary" title="${file.log}">${file.log}</td>
      `;
      tbody.appendChild(tr);
    }

    if (filesInDir.length === 0 && dirs.size === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" style="text-align:center; color:#94a3b8; padding:20px;">No files matching "${query}" in this directory.</td>`;
      tbody.appendChild(tr);
    }
  }

  function renderCommitHistory() {
    const tbody = document.getElementById("commitsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    for (const commit of REPO_DATA.commits) {
      const tr = document.createElement("tr");
      tr.className = "clickable";
      tr.onclick = (e) => {
        if (e.target.closest("a")) return;
        window.echoRepo.viewFile(commit.file);
      };
      tr.innerHTML = `
        <td><code class="commit-hash">${commit.hash}</code></td>
        <td class="author-tag">${commit.author}</td>
        <td style="color:#64748b;">${commit.date}</td>
        <td>
          <a href="javascript:void(0)" onclick="window.echoRepo.viewFile('${commit.file}'); event.stopPropagation();">${commit.file}</a>
          ${commit.hasDiff ? `<a href="javascript:void(0)" onclick="window.echoRepo.openDiff('${commit.file}'); event.stopPropagation();" style="margin-left:6px; font-size:10px; color:#ea6c00; font-weight:bold;">[diff]</a>` : ""}
        </td>
        <td class="log-summary" title="${commit.message}">${commit.message}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  function renderIrcLogs() {
    const container = document.getElementById("ircLogContainer");
    if (!container) return;
    container.innerHTML = "";

    for (const item of REPO_DATA.ircLogs) {
      const row = document.createElement("div");
      row.className = "irc-line";
      let msgHtml = escapeHtml(item.msg);
      msgHtml = msgHtml.replace(/(src\/[a-zA-Z0-9_\/]+\.[ch]|tools\/[a-zA-Z0-9_\/]+\.py)/g, (match) => {
        return `<a href="javascript:void(0)" onclick="window.echoRepo.viewFile('${match}')" style="color:#38bdf8; text-decoration:underline;">${match}</a>`;
      });
      row.innerHTML = `
        <span class="irc-time">[${item.time.split(" ")[1]}]</span>
        <span class="irc-nick irc-nick-${item.nick}">&lt;${item.nick}&gt;</span>
        <span class="irc-msg ${item.highlight ? "highlight" : ""}">${msgHtml}</span>
      `;
      container.appendChild(row);
    }
  }

  function renderSectorMap() {
    const pre = document.getElementById("sectorMapPre");
    if (!pre) return;
    pre.textContent = REPO_DATA.sectorMap;
  }

  function renderFileContent() {
    const pane = document.getElementById("codeViewer");
    const title = document.getElementById("codeFileTitle");
    const content = document.getElementById("codeContent");
    const diffBtn = document.getElementById("viewDiffBtn");
    const hexBtn = document.getElementById("hexToggleBtn");

    if (!REPO_DATA.activeFile) {
      pane.style.display = "none";
      return;
    }

    const file = REPO_DATA.files[REPO_DATA.activeFile];
    if (!file) return;

    pane.style.display = "block";
    title.textContent = `${REPO_DATA.activeFile} (Rev ${file.rev} - ${file.author})`;

    if (REPO_DATA.hexMode) {
      content.className = "hex-pre";
      content.textContent = formatHexDump(file.content);
      if (hexBtn) hexBtn.textContent = "Text / Source Mode";
    } else {
      content.className = "code-pre-box";
      content.textContent = file.content;
      if (hexBtn) hexBtn.textContent = "Hex Dump Mode";
    }

    if (file.hasDiff) {
      diffBtn.style.display = "inline-block";
      diffBtn.onclick = () => window.echoRepo.openDiff(REPO_DATA.activeFile);
    } else {
      diffBtn.style.display = "none";
    }

    setTimeout(() => {
      pane.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function renderDiffModal(filePath) {
    const modal = document.getElementById("diffModal");
    const meta = document.getElementById("diffMeta");
    const pre = document.getElementById("diffPre");
    const file = REPO_DATA.files[filePath];

    if (!file || !file.diff) return;

    meta.innerHTML = `
      <strong>Comparing Revisions:</strong> ${filePath} (Rev 1.3 &rarr; Rev 1.4)<br>
      <strong>Committer:</strong> ${file.author} &bull; <strong>Timestamp:</strong> ${file.age}<br>
      <strong>Log:</strong> <em>${file.log}</em>
    `;

    const lines = file.diff.split("\n");
    let colorizedHtml = "";
    for (const line of lines) {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        colorizedHtml += `<span class="diff-line-add">${escapeHtml(line)}</span>`;
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        colorizedHtml += `<span class="diff-line-del">${escapeHtml(line)}</span>`;
      } else {
        colorizedHtml += `<span class="diff-line-ctx">${escapeHtml(line)}</span>`;
      }
    }
    pre.innerHTML = colorizedHtml;
    modal.style.display = "flex";
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Public Interface
  window.echoRepo = {
    navigate: function (path) {
      playClick(750, 0.012);
      REPO_DATA.currentPath = path;
      REPO_DATA.filterQuery = "";
      const input = document.getElementById("fileFilterInput");
      if (input) input.value = "";
      renderBreadcrumbs();
      renderFileList();
    },

    viewFile: function (filePath) {
      playClick(650, 0.015);

      // If called from another tab (e.g. Commit History or IRC Logs), switch to the Files tab
      if (REPO_DATA.activeTab !== "files") {
        window.echoRepo.switchTab("files");
      }

      // Automatically sync directory path to the file's parent directory
      if (filePath.includes("/")) {
        const lastSlash = filePath.lastIndexOf("/");
        REPO_DATA.currentPath = "/" + filePath.slice(0, lastSlash);
      } else {
        REPO_DATA.currentPath = "/";
      }
      REPO_DATA.filterQuery = "";
      const input = document.getElementById("fileFilterInput");
      if (input) input.value = "";
      renderBreadcrumbs();
      renderFileList();

      REPO_DATA.activeFile = filePath;
      renderFileContent();
    },

    closeFile: function () {
      playClick(500, 0.015);
      REPO_DATA.activeFile = null;
      renderFileContent();
    },

    toggleHexMode: function () {
      playClick(900, 0.02);
      REPO_DATA.hexMode = !REPO_DATA.hexMode;
      renderFileContent();
    },

    toggleSound: function () {
      REPO_DATA.soundEnabled = !REPO_DATA.soundEnabled;
      const btn = document.getElementById("soundToggleBtn");
      if (btn) {
        btn.textContent = REPO_DATA.soundEnabled ? "Sound: ON" : "Sound: OFF";
      }
      if (REPO_DATA.soundEnabled) {
        playClick(880, 0.03);
      }
    },

    filterFiles: function (query) {
      REPO_DATA.filterQuery = query;
      renderFileList();
    },

    openDiff: function (filePath) {
      playClick(950, 0.025);
      renderDiffModal(filePath);
    },

    closeDiff: function () {
      playClick(450, 0.015);
      const modal = document.getElementById("diffModal");
      if (modal) modal.style.display = "none";
    },

    claimPasscode: function () {
      playClick(1200, 0.05);
      const userId = getEffectiveUserId();
      notifyStepCompletion(userId);
    },

    switchTab: function (tabName) {
      playClick(800, 0.015);
      REPO_DATA.activeTab = tabName;

      const tabs = ["files", "commits", "irc", "forensics", "stats"];
      for (const t of tabs) {
        const tabEl = document.getElementById("tab" + t.charAt(0).toUpperCase() + t.slice(1));
        const secEl = document.getElementById("section" + t.charAt(0).toUpperCase() + t.slice(1));
        if (tabEl) {
          if (t === tabName) {
            tabEl.classList.add("active");
          } else {
            tabEl.classList.remove("active");
          }
        }
        if (secEl) {
          secEl.style.display = t === tabName ? "block" : "none";
        }
      }

      if (tabName === "commits") {
        renderCommitHistory();
      } else if (tabName === "irc") {
        renderIrcLogs();
      } else if (tabName === "forensics") {
        renderSectorMap();
      }
    },
  };

  // Initialize on DOM load
  document.addEventListener("DOMContentLoaded", () => {
    const effectiveUser = getEffectiveUserId();
    const tag = document.getElementById("operatorTag");
    if (tag && effectiveUser) {
      tag.textContent = effectiveUser.toUpperCase();
    }

    renderBreadcrumbs();
    renderFileList();
    renderCommitHistory();
    renderIrcLogs();
    renderSectorMap();
  });
})();
