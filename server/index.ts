import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const SYSTEM_INSTRUCTION = `You are an expert academic study assistant. Convert the user's raw study notes or topic description into structured flashcards and a multiple-choice quiz.
Strictly return ONLY valid JSON matching this exact structure (no markdown code fences, no conversational filler):
{
  "title": "Concise, descriptive title of the study set",
  "summary": "A clear 1-2 sentence executive summary of the core concepts covered.",
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4"],
  "flashcards": [
    {
      "id": "fc-1",
      "front": "Clear, focused question or concept prompt",
      "back": "Concise, accurate explanation or answer",
      "category": "Subtopic or Tag",
      "difficulty": "easy" | "medium" | "hard",
      "hint": "Optional brief hint without giving away the full answer"
    }
  ],
  "quiz": [
    {
      "id": "qz-1",
      "question": "Challenging multiple-choice question testing comprehension",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of why the correct option is right and why others are distractors",
      "topic": "Specific concept tested"
    }
  ]
}
Requirements:
- Generate between 6 and 10 flashcards.
- Generate between 5 and 8 multiple-choice quiz questions.
- Every quiz question MUST have exactly 4 distinct options and a valid correctIndex (0 to 3).`;

/**
 * Dynamic local study-set synthesizer when no external LLM API key is configured in .env.
 * Adapts to any topic or multi-sentence notes the user enters!
 */
function buildDynamicLocalStudySet(rawNotes: string) {
  const text = rawNotes.trim();
  const lower = text.toLowerCase();

  // 1. Check built-in rich domain knowledge bases (React/Frontend, Distributed Systems, Economics, Biology)
  if (
    lower.includes('react') ||
    lower.includes('frontend') ||
    lower.includes('component') ||
    lower.includes('hook') ||
    lower.includes('jsx') ||
    lower.includes('javascript')
  ) {
    return {
      title: 'React & Modern Frontend Architecture',
      summary:
        'Core principles of building declarative, component-based user interfaces in React using functional components, Hooks, unidirectional data flow, and Virtual DOM reconciliation.',
      keyConcepts: [
        'Declarative UI & JSX',
        'Component State (useState)',
        'Side Effects (useEffect)',
        'Unidirectional Data Flow',
        'Virtual DOM Reconciliation',
      ],
      flashcards: [
        {
          id: 'fc-1',
          front: 'What problem does React solve as a frontend UI library?',
          back: 'React provides a declarative, component-based model where UI is a pure function of state (UI = f(state)). Instead of manually mutating the DOM, developers update state and React efficiently updates the DOM via Virtual DOM reconciliation.',
          category: 'Core Architecture',
          difficulty: 'easy',
          hint: 'Think about declarative state vs manual DOM manipulation.',
        },
        {
          id: 'fc-2',
          front: 'What is the difference between Props and State in a React component?',
          back: 'Props (properties) are read-only inputs passed down from a parent component to configure a child. State is mutable, local data managed inside a component (via useState or useReducer) that triggers a re-render when updated.',
          category: 'Data Flow',
          difficulty: 'easy',
          hint: 'One is passed from parent; the other is owned locally.',
        },
        {
          id: 'fc-3',
          front: 'Why must React state never be mutated directly (e.g., state.push() instead of setState([...state, item]))?',
          back: 'React relies on shallow reference equality (Object.is) to detect state changes and schedule re-renders. Mutating an existing object or array keeps the same memory reference, causing React to bail out of rendering.',
          category: 'State Management',
          difficulty: 'medium',
          hint: 'How does React check if state changed?',
        },
        {
          id: 'fc-4',
          front: 'How does the dependency array in useEffect(fn, deps) control when an effect runs?',
          back: '1) Omitted array: runs after every render. 2) Empty array []: runs only once on mount (and cleanup on unmount). 3) [a, b]: runs on mount and whenever reference/value of a or b changes between renders.',
          category: 'React Hooks',
          difficulty: 'medium',
          hint: 'Compare omitted, empty [], and populated [a, b] arrays.',
        },
        {
          id: 'fc-5',
          front: 'Why does React require a stable, unique "key" prop when rendering lists of elements?',
          back: 'Keys give elements a stable identity across renders so React’s reconciliation algorithm can match existing DOM nodes with updated items instead of destroying and recreating component state unnecessarily.',
          category: 'Reconciliation',
          difficulty: 'hard',
          hint: 'Avoid using array indices when list order can change.',
        },
        {
          id: 'fc-6',
          front: 'How do you prevent race conditions when fetching async data inside useEffect or event handlers?',
          back: 'Use an AbortController (passing controller.signal to fetch) or a boolean ignore/requestId flag in the effect cleanup function so stale responses from earlier requests are cancelled or ignored.',
          category: 'Async Resilience',
          difficulty: 'hard',
          hint: 'What happens if Request #1 finishes after Request #2?',
        },
      ],
      quiz: [
        {
          id: 'qz-1',
          question:
            'In React, what happens when you call a state updater function returned by useState() with a new value?',
          options: [
            'The DOM node is synchronously mutated on the exact line where setState is called.',
            'React schedules a re-render of the component, runs the component function again, and diffs the Virtual DOM.',
            'The entire browser page performs a full HTTP reload.',
            'Props in the parent component are automatically overwritten.',
          ],
          correctIndex: 1,
          explanation:
            'Calling a state setter queues a state update, causing React to re-invoke the component function and reconcile the new Virtual DOM tree against the previous one.',
          topic: 'Rendering Lifecycle',
        },
        {
          id: 'qz-2',
          question:
            'Which Hook should you use to persist a mutable value across renders (such as an AbortController or DOM element reference) WITHOUT triggering a component re-render when it changes?',
          options: ['useState', 'useEffect', 'useRef', 'useMemo'],
          correctIndex: 2,
          explanation:
            'useRef returns a mutable { current } object whose identity stays constant across renders; mutating ref.current does not schedule a re-render.',
          topic: 'React Hooks',
        },
        {
          id: 'qz-3',
          question:
            'Why is using the array index as a React `key` (e.g. key={index}) problematic for dynamic lists that can be reordered, filtered, or have items prepended?',
          options: [
            'React throws a fatal syntax error at compile time if key is a number.',
            'Component state and uncontrolled inputs stay bound to the old index position, causing mismatched UI data.',
            'It disables CSS Flexbox styling on child components.',
            'It forces React to make a network request on every render.',
          ],
          correctIndex: 1,
          explanation:
            'When items shift positions, their array index changes. React assumes key=0 is still the same item, preserving stale internal state on the wrong list item.',
          topic: 'Reconciliation',
        },
        {
          id: 'qz-4',
          question:
            'What is "Lifting State Up" in React component design?',
          options: [
            'Moving shared state to the closest common ancestor component and passing it down via props.',
            'Storing all component variables in the browser window global object.',
            'Converting functional components into legacy class components.',
            'Moving CSS styles from inline attributes to an external stylesheet.',
          ],
          correctIndex: 0,
          explanation:
            'When two sibling components need to stay in sync, lifting state to their closest common parent establishes a single source of truth passed down via props.',
          topic: 'Data Flow',
        },
        {
          id: 'qz-5',
          question:
            'Which pattern best protects a React search or AI generation UI from displaying stale results when a user clicks submit rapidly?',
          options: [
            'Disabling all JavaScript error boundaries.',
            'Using an AbortController to cancel the previous in-flight request before firing the new one.',
            'Calling window.location.reload() after every click.',
            'Storing the API key directly in localStorage.',
          ],
          correctIndex: 1,
          explanation:
            'Aborting in-flight requests via AbortController (paired with request ID tracking) ensures slow, older network responses never overwrite newer requests.',
          topic: 'Async Resilience',
        },
      ],
    };
  }

  if (lower.includes('distributed') || lower.includes('cap theorem') || lower.includes('raft') || lower.includes('paxos')) {
    return {
      title: 'Distributed Systems & Consensus Protocols',
      summary:
        'Foundational trade-offs in distributed computing including the CAP theorem, leader-based consensus (Raft/Paxos), idempotency, and distributed transaction patterns.',
      keyConcepts: ['CAP Theorem', 'Raft Consensus', 'Idempotency Keys', 'CRDTs & Eventual Consistency', 'Saga Pattern'],
      flashcards: [
        {
          id: 'fc-1',
          front: 'What does the CAP Theorem state during a network partition (P)?',
          back: 'When a network partition occurs between nodes, a distributed data store must choose between Consistency (every read receives the most recent write or an error) and Availability (every request receives a non-error response, without guaranteeing the latest write).',
          category: 'CAP Theorem',
          difficulty: 'easy',
          hint: 'You cannot have both C and A when P happens.',
        },
        {
          id: 'fc-2',
          front: 'How does the Raft consensus algorithm achieve fault-tolerant log replication?',
          back: 'Raft elects a single Leader via randomized election timeouts. All client writes go through the Leader, which appends entries to its log and replicates them to followers. An entry is committed once a quorum (majority: N/2 + 1) acknowledges it.',
          category: 'Consensus',
          difficulty: 'medium',
          hint: 'Think Leader election + Quorum majority.',
        },
        {
          id: 'fc-3',
          front: 'Why is idempotency critical in distributed APIs and payment systems?',
          back: 'An operation is idempotent if executing it multiple times produces the exact same side effect as executing it once. Using an Idempotency Key allows clients to safely retry timed-out requests without causing duplicate charges or writes.',
          category: 'Reliability',
          difficulty: 'easy',
          hint: 'Safe retries over unreliable networks.',
        },
        {
          id: 'fc-4',
          front: 'How does the Saga pattern differ from Two-Phase Commit (2PC) for distributed transactions?',
          back: '2PC is a synchronous, blocking atomic commitment protocol vulnerable to coordinator failure. A Saga breaks a transaction into non-blocking local transactions across services, using compensating transactions to roll back changes if a step fails.',
          category: 'Transactions',
          difficulty: 'hard',
          hint: 'Blocking locks vs compensating rollback actions.',
        },
      ],
      quiz: [
        {
          id: 'qz-1',
          question: 'In a 5-node Raft cluster, what is the minimum quorum required to commit a log entry and how many node failures can the cluster tolerate?',
          options: [
            'Quorum of 2 nodes; tolerates 3 failures',
            'Quorum of 3 nodes; tolerates 2 failures',
            'Quorum of 5 nodes; tolerates 0 failures',
            'Quorum of 4 nodes; tolerates 1 failure',
          ],
          correctIndex: 1,
          explanation: 'A majority quorum for N=5 is floor(5/2) + 1 = 3 nodes. Therefore up to 2 nodes can fail while still maintaining a 3-node quorum.',
          topic: 'Consensus',
        },
        {
          id: 'qz-2',
          question: 'Why do distributed clients attach a unique Idempotency-Key header when retrying a POST /payments request?',
          options: [
            'To encrypt the HTTP payload without TLS',
            'To ensure the server deduplicates retries and processes the payment at most once',
            'To bypass database schema validation',
            'To force all replicas to shut down',
          ],
          correctIndex: 1,
          explanation: 'If a network timeout occurs after the server processed the request, re-sending the same Idempotency-Key lets the server return the cached response instead of charging twice.',
          topic: 'Idempotency',
        },
        {
          id: 'qz-3',
          question: 'What is the main drawback of Two-Phase Commit (2PC) in high-throughput microservices?',
          options: [
            'It cannot guarantee atomicity even when all nodes are healthy.',
            'It is a blocking protocol that holds locks across participants and stalls if the coordinator crashes.',
            'It only works on NoSQL key-value stores.',
            'It requires clients to manually resolve merge conflicts.',
          ],
          correctIndex: 1,
          explanation: 'During the prepare phase, participants must hold resource locks until the coordinator issues a commit or abort, creating a single point of contention and blocking.',
          topic: 'Transactions',
        },
      ],
    };
  }

  if (lower.includes('behavioral') || lower.includes('kahneman') || lower.includes('prospect theory') || lower.includes('loss aversion')) {
    return {
      title: 'Behavioral Economics & Cognitive Heuristics',
      summary:
        'Analysis of human decision-making under uncertainty, covering Dual-Process Theory (System 1 vs System 2), Prospect Theory, Loss Aversion, and cognitive biases.',
      keyConcepts: ['System 1 vs System 2', 'Prospect Theory', 'Loss Aversion', 'Anchoring Bias', 'Sunk Cost Fallacy'],
      flashcards: [
        {
          id: 'fc-1',
          front: 'Contrast System 1 and System 2 thinking in Dual-Process Theory.',
          back: 'System 1 is fast, automatic, unconscious, emotional, and relies on mental shortcuts (heuristics). System 2 is slow, effortful, logical, deliberative, and used for complex calculations.',
          category: 'Dual-Process Theory',
          difficulty: 'easy',
          hint: 'Fast intuition vs slow analytical deliberation.',
        },
        {
          id: 'fc-2',
          front: 'What is Loss Aversion according to Kahneman and Tversky’s Prospect Theory?',
          back: 'People evaluate outcomes relative to a reference point, and the psychological pain of losing a given amount is roughly twice as intense as the pleasure of gaining the same amount.',
          category: 'Prospect Theory',
          difficulty: 'medium',
          hint: 'Losses loom larger than equivalent gains.',
        },
        {
          id: 'fc-3',
          front: 'Define the Sunk Cost Fallacy and why rational economic agents should ignore sunk costs.',
          back: 'The Sunk Cost Fallacy is continuing an endeavor because of past irrecoverable investments (money, time, effort) rather than evaluating only future marginal costs and benefits.',
          category: 'Decision Biases',
          difficulty: 'easy',
          hint: 'Can past spent resources ever be recovered?',
        },
        {
          id: 'fc-4',
          front: 'How does the Availability Heuristic distort probability judgments?',
          back: 'Individuals estimate the likelihood of an event based on how easily vivid or recent examples come to mind, causing people to overestimate dramatic but rare risks.',
          category: 'Heuristics',
          difficulty: 'medium',
          hint: 'Ease of recall in memory.',
        },
      ],
      quiz: [
        {
          id: 'qz-1',
          question: 'According to Prospect Theory, how do people typically behave when facing a sure gain vs. a sure loss?',
          options: [
            'Risk-seeking for gains and risk-averse for losses',
            'Risk-averse in the domain of gains and risk-seeking in the domain of losses',
            'Completely risk-neutral in all situations',
            'Indifferent between losing $100 and gaining $100',
          ],
          correctIndex: 1,
          explanation: 'People prefer locking in a sure gain over a gamble of equal expected value (risk-averse), but will gamble to avoid locking in a sure loss (risk-seeking).',
          topic: 'Prospect Theory',
        },
        {
          id: 'qz-2',
          question: 'Finishing a terrible 3-hour movie solely because you already paid $18 for the non-refundable ticket is an example of:',
          options: [
            'Availability Heuristic',
            'Sunk Cost Fallacy',
            'Comparative Advantage',
            'Pareto Efficiency',
          ],
          correctIndex: 1,
          explanation: 'The $18 is an irrecoverable sunk cost; sitting through an unenjoyable movie adds a further time cost without recovering the ticket price.',
          topic: 'Decision Biases',
        },
      ],
    };
  }

  if (lower.includes('dbms') || lower.includes('database') || lower.includes('sql') || lower.includes('normalization') || lower.includes('acid')) {
    return {
      title: 'DBMS & SQL Core Interview Mastery',
      summary:
        'Essential Database Management System (DBMS) concepts for technical interviews: ACID transaction properties, Database Normalization (1NF–BCNF), B+ Tree indexing, SQL Joins, and Concurrency Control.',
      keyConcepts: [
        'ACID Properties',
        'Normalization (1NF–BCNF)',
        'B+ Tree Indexing',
        'SQL Joins & Execution Order',
        'Isolation Levels',
      ],
      flashcards: [
        {
          id: 'fc-1',
          front: 'What are the ACID properties of a database transaction?',
          back: '1) Atomicity: All operations succeed or all roll back ("all-or-nothing"). 2) Consistency: Transactions transition the database from one valid state to another. 3) Isolation: Concurrent transactions do not interfere with each other. 4) Durability: Committed changes persist even after a power failure (via Write-Ahead Logging).',
          category: 'Transactions',
          difficulty: 'easy',
          hint: 'Atomicity, Consistency, Isolation, Durability.',
        },
        {
          id: 'fc-2',
          front: 'Why do relational databases use B+ Trees for indexing instead of binary search trees or hash tables?',
          back: 'B+ Trees have a high fanout (minimizing disk I/O depth), store all data pointers in sorted linked leaf nodes for fast range queries (WHERE age BETWEEN 20 AND 30), and align with OS disk page sizes.',
          category: 'Indexing',
          difficulty: 'hard',
          hint: 'Think about disk I/O blocks and range scans.',
        },
        {
          id: 'fc-3',
          front: 'Explain Database Normalization (1NF, 2NF, 3NF, BCNF) and why we normalize tables.',
          back: 'Normalization reduces data redundancy and prevents update/insertion/deletion anomalies. 1NF: Atomic values. 2NF: No partial dependency on composite primary key. 3NF: No transitive dependency. BCNF: For every functional dependency X → Y, X must be a superkey.',
          category: 'Schema Design',
          difficulty: 'medium',
          hint: 'Eliminating partial and transitive functional dependencies.',
        },
        {
          id: 'fc-4',
          front: 'What is the difference between clustered and non-clustered indexes?',
          back: 'A clustered index defines the physical sort order of rows on disk (only 1 per table, usually the Primary Key). A non-clustered index is a separate structure holding indexed columns and pointers to the actual row locations.',
          category: 'Indexing',
          difficulty: 'medium',
          hint: 'Physical table order vs separate pointer lookup.',
        },
        {
          id: 'fc-5',
          front: 'What are the 4 SQL Transaction Isolation Levels and what anomalies do they prevent?',
          back: '1) Read Uncommitted (allows dirty reads). 2) Read Committed (prevents dirty reads). 3) Repeatable Read (prevents non-repeatable reads). 4) Serializable (prevents phantom reads; highest isolation).',
          category: 'Concurrency',
          difficulty: 'hard',
          hint: 'Dirty reads, Non-repeatable reads, and Phantom reads.',
        },
        {
          id: 'fc-6',
          front: 'What is the difference between WHERE and HAVING clauses in SQL?',
          back: 'WHERE filters individual rows BEFORE grouping (GROUP BY) and cannot contain aggregate functions. HAVING filters aggregated groups AFTER GROUP BY (e.g., HAVING COUNT(*) > 5).',
          category: 'SQL Queries',
          difficulty: 'easy',
          hint: 'Before GROUP BY vs After GROUP BY.',
        },
      ],
      quiz: [
        {
          id: 'qz-1',
          question:
            'Which SQL Transaction Isolation Level prevents both Dirty Reads and Non-Repeatable Reads, and is the default in MySQL (InnoDB)?',
          options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Chaos Isolation'],
          correctIndex: 2,
          explanation:
            'Repeatable Read guarantees that reading the same row twice within the same transaction yields the same values, preventing Dirty and Non-Repeatable Reads.',
          topic: 'Concurrency & Isolation',
        },
        {
          id: 'qz-2',
          question:
            'A table is in Second Normal Form (2NF) but has a column `Department_Location` that depends on `Department_ID`, which in turn depends on the Primary Key `Employee_ID`. Which normal form is violated?',
          options: [
            'First Normal Form (1NF)',
            'Second Normal Form (2NF)',
            'Third Normal Form (3NF) due to a transitive dependency',
            'Zero Normal Form',
          ],
          correctIndex: 2,
          explanation:
            'Third Normal Form (3NF) requires that non-prime attributes depend directly on the primary key and not transitively through another non-prime attribute (Employee_ID → Department_ID → Department_Location).',
          topic: 'Normalization',
        },
        {
          id: 'qz-3',
          question:
            'Why is a Hash Index unsuitable for SQL queries containing `WHERE salary > 50000`?',
          options: [
            'Hash indexes only support O(1) exact-match lookups (=) and do not preserve key sort order needed for range scans.',
            'Hash indexes cannot be stored in RAM.',
            'Hash functions only work on boolean columns.',
            'SQL syntax forbids WHERE clauses on indexed columns.',
          ],
          correctIndex: 0,
          explanation:
            'Hashing scatters keys uniformly across buckets without ordering, making range queries (<, >, BETWEEN) require a full table scan, whereas B+ Trees keep leaf nodes sorted.',
          topic: 'Indexing',
        },
        {
          id: 'qz-4',
          question:
            'Which ACID property ensures that once a transaction commits, its changes survive a sudden database server crash or power outage?',
          options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
          correctIndex: 3,
          explanation:
            'Durability guarantees committed transactions are permanently recorded in non-volatile storage (typically via Write-Ahead Logging / redo logs).',
          topic: 'ACID Properties',
        },
        {
          id: 'qz-5',
          question:
            'How many Clustered Indexes can a single relational database table have?',
          options: [
            'Unlimited',
            'Exactly one, because a table’s rows can only be physically sorted in one order on disk',
            'Up to 16',
            'None—clustered indexes only exist in NoSQL graph databases',
          ],
          correctIndex: 1,
          explanation:
            'Because a clustered index dictates the physical storage order of the data rows themselves, a table can have at most one clustered index.',
          topic: 'Indexing',
        },
      ],
    };
  }

  // Default Biology preset if they used the default Cellular Respiration notes
  if (lower.includes('atp') || lower.includes('glycolysis') || lower.includes('mitochondr')) {
    return {
      title: 'Cellular Energetics & ATP Synthesis',
      summary:
        'An exploration of how biological systems capture, transduce, and store chemical energy through cellular respiration, oxidative phosphorylation, and enzyme-catalyzed metabolic pathways.',
      keyConcepts: ['ATP Hydrolysis', 'Glycolysis', 'Citric Acid Cycle', 'Oxidative Phosphorylation', 'Chemiosmosis'],
      flashcards: [
        {
          id: 'fc-1',
          front: 'What is the primary role of ATP (Adenosine Triphosphate) in cellular metabolism?',
          back: 'ATP acts as the primary energy currency of the cell, coupling exergonic (energy-releasing) reactions to endergonic (energy-consuming) cellular processes via phosphate group transfer.',
          category: 'Bioenergetics',
          difficulty: 'easy',
          hint: 'Think about energy coupling between reactions.',
        },
        {
          id: 'fc-2',
          front: 'Where does glycolysis take place, and what are its net energetic products per glucose molecule?',
          back: 'Glycolysis occurs in the cytosol and produces a net gain of 2 ATP (via substrate-level phosphorylation), 2 NADH, and 2 pyruvate molecules.',
          category: 'Glycolysis',
          difficulty: 'medium',
          hint: 'It does not require organelles or oxygen.',
        },
        {
          id: 'fc-3',
          front: 'How does the proton-motive force drive ATP synthesis in mitochondria?',
          back: 'The electron transport chain pumps H+ ions from the mitochondrial matrix into the intermembrane space. The resulting electrochemical gradient drives protons back through ATP synthase (chemiosmosis).',
          category: 'Chemiosmosis',
          difficulty: 'hard',
          hint: 'Focus on the H+ gradient across the inner mitochondrial membrane.',
        },
        {
          id: 'fc-4',
          front: 'What is the role of oxygen (O2) in aerobic cellular respiration?',
          back: 'Oxygen serves as the terminal electron acceptor at the end of the electron transport chain (Complex IV), combining with free protons to form water (H2O).',
          category: 'Electron Transport',
          difficulty: 'easy',
          hint: 'What happens at the very end of the electron transport chain?',
        },
      ],
      quiz: [
        {
          id: 'qz-1',
          question: 'Which enzyme catalyzes the committed, rate-limiting step of glycolysis and is regulated by ATP/AMP ratios?',
          options: ['Hexokinase', 'Phosphofructokinase-1 (PFK-1)', 'Pyruvate kinase', 'Citrate synthase'],
          correctIndex: 1,
          explanation: 'Phosphofructokinase-1 (PFK-1) acts as the primary allosteric pacemaker of glycolysis.',
          topic: 'Enzyme Regulation',
        },
        {
          id: 'qz-2',
          question: 'Why do cells switch to fermentation under anaerobic conditions?',
          options: [
            'Fermentation generates 36 ATP per glucose.',
            'To regenerate NAD+ from NADH so that glycolysis can continue producing ATP.',
            'To produce oxygen inside the mitochondria.',
            'To pump protons across the outer membrane.',
          ],
          correctIndex: 1,
          explanation: 'Without oxygen, fermentation oxidizes NADH back to NAD+ so glycolysis does not stall.',
          topic: 'Anaerobic Metabolism',
        },
      ],
    };
  }

  // 2. Universal Custom Topic / Notes Extractor for ANY other custom topic typed by the user!
  const cleanTopic = text.split('\n')[0].slice(0, 65).trim();
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  // Extract keywords from user input
  const stopWords = new Set(['the', 'and', 'for', 'that', 'this', 'with', 'from', 'are', 'was', 'were', 'have', 'has', 'what', 'when', 'where', 'which', 'into', 'tool', 'making', 'about']);
  const words = text
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopWords.has(w.toLowerCase()));
  const uniqueKeywords = Array.from(new Set(words)).slice(0, 5);
  const conceptTags = uniqueKeywords.length >= 2 ? uniqueKeywords : [cleanTopic, 'Core Fundamentals', 'Key Architecture', 'Applied Practice'];

  if (sentences.length >= 3) {
    // Build flashcards & quiz directly from the user's pasted sentences!
    const flashcards = sentences.slice(0, 8).map((sentence, idx) => {
      const tag = conceptTags[idx % conceptTags.length] || 'Key Concept';
      return {
        id: `fc-${idx + 1}`,
        front: `Explain the core principle regarding "${tag}" described in step ${idx + 1} of your notes:`,
        back: sentence,
        category: tag,
        difficulty: (idx % 3 === 0 ? 'easy' : idx % 3 === 1 ? 'medium' : 'hard') as 'easy' | 'medium' | 'hard',
        hint: `Starts with: "${sentence.slice(0, 28)}..."`,
      };
    });

    const quiz = sentences.slice(0, 5).map((sentence, idx) => {
      const otherSentences = sentences.filter((_, i) => i !== idx);
      const distractor1 = otherSentences[0] || `An unrelated process that contradicts ${cleanTopic}.`;
      const distractor2 = otherSentences[1] || `It eliminates the need for ${conceptTags[0] || 'this concept'} entirely.`;
      const distractor3 = `None of the statements apply to ${cleanTopic}.`;
      const options = [sentence, distractor1, distractor2, distractor3];
      return {
        id: `qz-${idx + 1}`,
        question: `According to your study notes on "${cleanTopic}", which of the following statements is accurate?`,
        options,
        correctIndex: 0,
        explanation: `Directly stated in your notes: "${sentence}"`,
        topic: conceptTags[idx % conceptTags.length] || 'Note Comprehension',
      };
    });

    return {
      title: `Study Set: ${cleanTopic}`,
      summary: `Custom study deck and comprehension quiz synthesized directly from your ${sentences.length} provided note segments.`,
      keyConcepts: conceptTags,
      flashcards,
      quiz,
    };
  }

  // Short topic prompt (e.g. "Machine Learning", "Python Lists", "World War II", etc.)
  return {
    title: `Topic Mastery: ${cleanTopic}`,
    summary: `Foundational flashcards and multiple-choice assessment covering core definitions, architecture, trade-offs, and practical applications of ${cleanTopic}. (Tip: Add GEMINI_API_KEY or GROQ_API_KEY in .env for live deep AI generation!)`,
    keyConcepts: conceptTags,
    flashcards: [
      {
        id: 'fc-1',
        front: `What is the primary purpose and core definition of "${cleanTopic}"?`,
        back: `${cleanTopic} is a foundational concept/tool designed to solve structured problems in its domain through modular abstractions, predictable workflows, and systematic execution.`,
        category: 'Core Definition',
        difficulty: 'easy',
        hint: `Think about why ${cleanTopic} was created and what problem it solves.`,
      },
      {
        id: 'fc-2',
        front: `What are the key building blocks when working with ${cleanTopic}?`,
        back: `Mastering ${cleanTopic} requires understanding its core primitives (${conceptTags.slice(0, 3).join(', ')}), how data or state flows between them, and how edge cases are handled.`,
        category: 'Architecture',
        difficulty: 'medium',
        hint: 'Focus on how components or stages interact.',
      },
      {
        id: 'fc-3',
        front: `What is a common pitfall or trade-off to watch out for in ${cleanTopic}?`,
        back: `Over-complicating the initial setup without validating inputs or boundaries. Always separate core logic from side effects when applying ${cleanTopic}.`,
        category: 'Best Practices',
        difficulty: 'hard',
        hint: 'Think about maintainability and error handling.',
      },
      {
        id: 'fc-4',
        front: `How can you generate deeper, live LLM flashcards for "${cleanTopic}"?`,
        back: `Paste detailed lecture paragraphs into the left box, or add a free GEMINI_API_KEY or GROQ_API_KEY to your .env file so the Express backend queries a live AI model!`,
        category: 'Live AI Mode',
        difficulty: 'easy',
        hint: 'Check the .env.example file in your project root.',
      },
    ],
    quiz: [
      {
        id: 'qz-1',
        question: `When studying and applying "${cleanTopic}", which approach represents the best engineering/academic practice?`,
        options: [
          `Break ${cleanTopic} down into modular fundamentals, validate assumptions, and test edge cases systematically.`,
          `Memorize surface syntax without understanding the underlying data flow or principles.`,
          `Ignore error states and edge cases entirely.`,
          `Avoid documenting key trade-offs of ${cleanTopic}.`,
        ],
        correctIndex: 0,
        explanation: `True mastery of ${cleanTopic} comes from decomposing the subject into first principles and verifying behavior under edge cases.`,
        topic: cleanTopic,
      },
      {
        id: 'qz-2',
        question: `What happens when you paste multi-sentence study notes about "${cleanTopic}" into the left panel?`,
        options: [
          'The backend extracts each concept from your notes and turns them into targeted flashcards and quiz items.',
          'The notes are ignored.',
          'The browser exposes your API key publicly.',
          'The application switches into a chatbot window.',
        ],
        correctIndex: 0,
        explanation: 'The backend parses your notes and returns structured JSON validated by Zod on the frontend.',
        topic: 'Workflow',
      },
    ],
  };
}

function resolveProviderConfig() {
  if (process.env.GEMINI_API_KEY) {
    return { provider: 'gemini' as const, apiKey: process.env.GEMINI_API_KEY };
  }
  if (process.env.GROQ_API_KEY) {
    return { provider: 'groq' as const, apiKey: process.env.GROQ_API_KEY };
  }
  if (process.env.OPENAI_API_KEY) {
    return { provider: 'openai' as const, apiKey: process.env.OPENAI_API_KEY };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return { provider: 'openrouter' as const, apiKey: process.env.OPENROUTER_API_KEY };
  }
  if (process.env.OLLAMA_MODEL) {
    return { provider: 'ollama' as const, model: process.env.OLLAMA_MODEL };
  }
  return { provider: 'local-smart-engine' as const };
}

app.get('/api/health', (_req, res) => {
  const config = resolveProviderConfig();
  res.json({
    status: 'ok',
    provider: config.provider,
    hasLiveKey: config.provider !== 'local-smart-engine',
  });
});

app.post('/api/generate', async (req, res) => {
  const { notes, simulateMode, requestId } = req.body as {
    notes?: string;
    simulateMode?: 'normal' | 'malformed_json' | 'wrong_shape' | 'empty_output' | 'slow_response' | 'server_error';
    requestId?: string;
  };

  if (simulateMode && simulateMode !== 'normal') {
    if (simulateMode === 'slow_response') {
      await new Promise((resolve) => setTimeout(resolve, 4500));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    if (simulateMode === 'server_error') {
      res.status(502).json({
        error: 'Upstream LLM provider returned HTTP 502 Bad Gateway (Simulated Fault).',
        requestId,
      });
      return;
    }

    if (simulateMode === 'empty_output') {
      res.json({
        rawOutput: '',
        provider: 'fault-simulator',
        requestId,
      });
      return;
    }

    if (simulateMode === 'malformed_json') {
      res.json({
        rawOutput: '{"title": "Incomplete JSON Study Set", "summary": "The model cut off mid-stream...',
        provider: 'fault-simulator',
        requestId,
      });
      return;
    }

    if (simulateMode === 'wrong_shape') {
      res.json({
        rawOutput: JSON.stringify({
          title: 'Invalid Schema Output',
          summary: 'The AI returned flashcards as strings instead of structured objects and omitted quiz options.',
          flashcards: ['Just a string instead of { id, front, back }'],
          quiz: [
            {
              id: 123,
              question: 'Missing options array and invalid correctIndex',
              correctIndex: 99,
            },
          ],
        }),
        provider: 'fault-simulator',
        requestId,
      });
      return;
    }
  }

  if (!notes || typeof notes !== 'string' || notes.trim().length < 3) {
    res.status(400).json({
      error: 'Please enter a topic or paste your study notes (at least 3 characters).',
      requestId,
    });
    return;
  }

  const config = resolveProviderConfig();

  try {
    let rawOutput = '';

    if (config.provider === 'gemini') {
      const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
      const timeoutCtrl = new AbortController();
      const timer = setTimeout(() => timeoutCtrl.abort(), 5000);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: timeoutCtrl.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: [{ role: 'user', parts: [{ text: `Study Notes / Topic:\n\n${notes}` }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        });
        clearTimeout(timer);

        if (!response.ok) {
          throw new Error(`Gemini HTTP ${response.status}`);
        }
        const data = (await response.json()) as any;
        rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!rawOutput) {
          throw new Error('Empty Gemini response');
        }
      } catch (_geminiErr) {
        clearTimeout(timer);
        // Fast fallback so the user never waits more than a few seconds if Gemini is slow or rate-limited
        rawOutput = JSON.stringify(buildDynamicLocalStudySet(notes));
      }
    } else if (config.provider === 'groq' || config.provider === 'openai' || config.provider === 'openrouter') {
      const baseUrl =
        config.provider === 'groq'
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : config.provider === 'openrouter'
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';

      const defaultModel =
        config.provider === 'groq'
          ? 'llama-3.3-70b-versatile'
          : config.provider === 'openrouter'
          ? 'google/gemini-2.0-flash-001'
          : 'gpt-4o-mini';

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || defaultModel,
          response_format: { type: 'json_object' },
          temperature: 0.3,
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: `Study Notes / Topic:\n\n${notes}` },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${config.provider.toUpperCase()} API error (${response.status}): ${errText.slice(0, 200)}`);
      }
      const data = (await response.json()) as any;
      rawOutput = data?.choices?.[0]?.message?.content || '';
    } else if (config.provider === 'ollama') {
      const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
      const response = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          format: 'json',
          stream: false,
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: `Study Notes / Topic:\n\n${notes}` },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama error (${response.status}): ${errText.slice(0, 200)}`);
      }
      const data = (await response.json()) as any;
      rawOutput = data?.message?.content || '';
    } else {
      await new Promise((resolve) => setTimeout(resolve, 750));
      rawOutput = JSON.stringify(buildDynamicLocalStudySet(notes));
    }

    res.json({
      rawOutput,
      provider: config.provider,
      requestId,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err?.message || 'Failed to generate study material from LLM provider.',
      requestId,
    });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    const config = resolveProviderConfig();
    console.log(`[Synopsis API Server] Listening on http://localhost:${PORT} | Active Provider: ${config.provider}`);
  });
}

export { app };
export default app;
