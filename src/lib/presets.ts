export interface SampleNotePreset {
  id: string;
  label: string;
  badge: string;
  content: string;
}

export const SAMPLE_PRESETS: SampleNotePreset[] = [
  {
    id: 'cellular-energetics',
    label: 'Cellular Respiration & ATP',
    badge: 'Biology',
    content: `Cellular Respiration and Bioenergetics:
1. ATP (Adenosine Triphosphate) is the cell's primary energy currency. Energy is released when the terminal phosphate bond is hydrolyzed (ATP -> ADP + Pi), coupling exergonic reactions to endergonic cellular work.
2. Glycolysis occurs in the cytosol without oxygen. It breaks down 1 glucose (6C) into 2 pyruvate (3C) molecules, yielding a net gain of 2 ATP (via substrate-level phosphorylation) and 2 NADH. Phosphofructokinase-1 (PFK-1) is the committed pace-making enzyme, allosterically inhibited by high ATP/citrate and activated by AMP.
3. Citric Acid Cycle (Krebs Cycle) takes place in the mitochondrial matrix. Acetyl-CoA enters the cycle, reducing NAD+ to NADH and FAD to FADH2 while releasing CO2.
4. Oxidative Phosphorylation & Chemiosmosis: NADH and FADH2 donate electrons to the Electron Transport Chain (Complexes I-IV) in the inner mitochondrial membrane. Proton pumping creates an electrochemical H+ gradient (lowest pH in the intermembrane space). Protons flow back through ATP Synthase to drive ATP synthesis. Oxygen (O2) is the terminal electron acceptor, forming water. Uncoupling agents collapse the proton gradient, halting ATP synthesis while generating heat.
5. Fermentation (lactic acid or ethanol) occurs under anaerobic conditions solely to regenerate NAD+ from NADH so glycolysis can continue.`,
  },
  {
    id: 'distributed-systems',
    label: 'Distributed Systems & Consensus',
    badge: 'Computer Science',
    content: `Distributed Systems Architecture:
- CAP Theorem: In the presence of a Network Partition (P), a distributed data store must choose between Consistency (C - every read receives the most recent write or an error) and Availability (A - every request receives a non-error response, without the guarantee that it contains the most recent write).
- Consensus Algorithms (Raft & Paxos): Used to achieve fault-tolerant state machine replication across a cluster. Raft elects a single Leader via randomized election timeouts. The leader accepts client log entries and replicates them to followers; an entry is committed once a quorum (majority: N/2 + 1) acknowledges it.
- Idempotency: An operation is idempotent if performing it multiple times has the exact same side-effect as performing it once. Essential for safe network retries in distributed APIs using idempotency keys.
- Eventual Consistency & CRDTs: Systems favoring availability allow replicas to diverge temporarily and reconcile asynchronously using Conflict-Free Replicated Data Types (CRDTs) or vector clocks.
- Two-Phase Commit (2PC) vs Saga Pattern: 2PC is a blocking atomic commitment protocol vulnerable to coordinator failure, whereas Sagas manage distributed transactions via a sequence of local transactions with compensating rollback actions.`,
  },
  {
    id: 'behavioral-econ',
    label: 'Behavioral Economics & Heuristics',
    badge: 'Economics',
    content: `Behavioral Economics & Cognitive Biases (Kahneman & Tversky):
- Dual-Process Theory: System 1 thinking is fast, automatic, emotional, and heuristic-driven. System 2 thinking is slow, deliberative, analytical, and effortful.
- Prospect Theory & Loss Aversion: People evaluate outcomes relative to a reference point rather than absolute wealth. Losses loom larger than equivalent gains (losing $100 hurts roughly 2x as much as gaining $100 feels good). Individuals tend to be risk-averse in the domain of gains and risk-seeking in the domain of losses.
- Anchoring Heuristic: Relying too heavily on the first piece of information encountered (the anchor) when making numerical estimates or negotiations.
- Availability Heuristic: Judging the probability or frequency of an event based on how easily examples come to mind (vivid or recent events are overestimated).
- Sunk Cost Fallacy: Continuing an endeavor or investment because of previously invested resources (time, money, effort) that cannot be recovered, rather than evaluating marginal future costs and benefits.`,
  },
];
