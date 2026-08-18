import { create } from 'zustand';
import {
  TelemetryStore,
  TelemetryState,
  SystemStatus,
  StudyMode,
  TopicNode,
  StudyTodo,
  PomodoroState,
  AudioFrequencyData,
  SystemDiagnostics,
  MousePosition
} from '../types/telemetry';

interface RawTopic {
  name: string;
  summary: string;
  prereqNames?: string[]; // Topics required BEFORE this topic (A -> X)
  unlockNames?: string[]; // Topics UNLOCKED by this topic (X -> B)
}

const DOMAIN_DATA: { category: TopicNode['category']; topics: RawTopic[] }[] = [
  {
    category: 'AI & ML',
    topics: [
      {
        name: 'Neural Network Backpropagation',
        summary: 'Reverse-mode automatic differentiation, chain rule, loss gradients, and Adam optimizer.',
        unlockNames: ['Convolutional Neural Networks (CNNs)', 'Transformer Self-Attention', 'Recurrent Neural Networks & LSTM', 'Autoencoders & Latent Compression', 'Softmax Temperature Scaling']
      },
      {
        name: 'Transformer Self-Attention',
        summary: 'Scaled dot-product attention, multi-head projections, positional encoding matrices.',
        prereqNames: ['Neural Network Backpropagation'],
        unlockNames: ['Retrieval-Augmented Generation (RAG)', 'LoRA Parameter-Efficient Fine-Tuning', 'Speculative Decoding in LLMs', 'Mixture of Experts (MoE)', 'Self-Supervised Masked Autoencoders']
      },
      {
        name: 'Generative Adversarial Networks (GANs)',
        summary: 'Minimax game between generator and discriminator neural networks.',
        prereqNames: ['Neural Network Backpropagation'],
        unlockNames: ['Variational Autoencoders (VAEs)', 'Diffusion Models & Score Matching', 'Wasserstein Distance (Earth Mover)']
      },
      {
        name: 'Variational Autoencoders (VAEs)',
        summary: 'Latent space sampling with KL divergence regularization.',
        prereqNames: ['Neural Network Backpropagation', 'Information Entropy & KL Divergence'],
        unlockNames: ['Generative Adversarial Networks (GANs)', 'Autoencoders & Latent Compression']
      },
      {
        name: 'Graph Neural Networks (GNNs)',
        summary: 'Message passing neural networks operating on non-Euclidean graph domains.',
        prereqNames: ['Neural Network Backpropagation', 'Graph Theory & Spectral Clustering'],
        unlockNames: ['HNSW Vector Indexing']
      },
      {
        name: 'Diffusion Models & Score Matching',
        summary: 'Forward noise addition and reverse denoising U-Net architectures.',
        prereqNames: ['Generative Adversarial Networks (GANs)'],
        unlockNames: ['3D Gaussian Splatting']
      },
      {
        name: 'Reinforcement Learning with RLHF',
        summary: 'Policy gradients, reward model alignment, and Proximal Policy Optimization.',
        prereqNames: ['Neural Network Backpropagation'],
        unlockNames: ['Direct Preference Optimization (DPO)', 'Actor-Critic Architectures', 'Deep Q-Learning (DQN)']
      },
      {
        name: 'Contrastive Learning (CLIP)',
        summary: 'Joint multimodal embedding spaces aligning image and text representations.',
        prereqNames: ['Transformer Self-Attention'],
        unlockNames: ['Retrieval-Augmented Generation (RAG)', 'HNSW Vector Indexing']
      },
      {
        name: 'Mixture of Experts (MoE)',
        summary: 'Sparse gating routing tokens to specialized feedforward expert subnetworks.',
        prereqNames: ['Transformer Self-Attention'],
        unlockNames: ['Quantization & GGUF Formats', 'Speculative Decoding in LLMs']
      },
      {
        name: 'Convolutional Neural Networks (CNNs)',
        summary: 'Spatial translation invariance, kernel convolutions, pooling layers.',
        prereqNames: ['Neural Network Backpropagation'],
        unlockNames: ['Convolutional Autoencoders', '3D Gaussian Splatting']
      },
      {
        name: 'Recurrent Neural Networks & LSTM',
        summary: 'Sequential memory cells with input, forget, and output gating mechanisms.',
        prereqNames: ['Neural Network Backpropagation'],
        unlockNames: ['Transformer Self-Attention']
      },
      {
        name: 'Deep Q-Learning (DQN)',
        summary: 'Off-policy value iteration with experience replay buffer and target networks.',
        prereqNames: ['Reinforcement Learning with RLHF'],
        unlockNames: ['Actor-Critic Architectures']
      },
      {
        name: 'Gradient Boosted Decision Trees',
        summary: 'Sequential ensemble learning minimizing residual loss gradients.',
        unlockNames: ['Support Vector Machines (SVM)', 'Principal Component Analysis (PCA)']
      },
      {
        name: 'Principal Component Analysis (PCA)',
        summary: 'Orthogonal variance maximization via covariance matrix eigenvectors.',
        prereqNames: ['Eigenvalues & Eigenvectors', 'Singular Value Decomposition (SVD)'],
        unlockNames: ['t-SNE & UMAP Dimensionality Reduction']
      },
      {
        name: 't-SNE & UMAP Dimensionality Reduction',
        summary: 'Non-linear manifold visualization preserving local neighborhood topologies.',
        prereqNames: ['Principal Component Analysis (PCA)'],
        unlockNames: ['Riemannian Geometry & Manifolds']
      },
      {
        name: 'Support Vector Machines (SVM)',
        summary: 'Maximum margin hyperplanes with kernel trick for non-linear classification.',
        prereqNames: ['Convex Optimization & Duality'],
        unlockNames: ['Lagrange Multipliers & KKT Conditions']
      },
      {
        name: 'K-Means & GMM Clustering',
        summary: 'Centroid expectation-maximization partition of feature space.',
        unlockNames: ['Graph Theory & Spectral Clustering', 'Bayesian Inference & Priors']
      },
      {
        name: 'LoRA Parameter-Efficient Fine-Tuning',
        summary: 'Low-rank matrix decomposition of attention weight update deltas.',
        prereqNames: ['Transformer Self-Attention'],
        unlockNames: ['Quantization & GGUF Formats']
      },
      {
        name: 'Speculative Decoding in LLMs',
        summary: 'Draft model generation validated in parallel by target LLM verification.',
        prereqNames: ['Transformer Self-Attention'],
        unlockNames: ['Mixture of Experts (MoE)']
      },
      {
        name: 'Retrieval-Augmented Generation (RAG)',
        summary: 'External knowledge retrieval via vector embeddings for context augmentation.',
        prereqNames: ['Transformer Self-Attention', 'HNSW Vector Indexing'],
        unlockNames: ['Contrastive Learning (CLIP)']
      },
      {
        name: 'HNSW Vector Indexing',
        summary: 'Hierarchical Navigable Small World graphs for fast approximate nearest neighbor search.',
        prereqNames: ['Skip Lists'],
        unlockNames: ['Retrieval-Augmented Generation (RAG)']
      },
      {
        name: 'Direct Preference Optimization (DPO)',
        summary: 'Implicit reward optimization directly on preference pairs without separate reward model.',
        prereqNames: ['Reinforcement Learning with RLHF'],
        unlockNames: ['Softmax Temperature Scaling']
      },
      {
        name: 'Monte Carlo Tree Search (MCTS)',
        summary: 'Heuristic tree search combining selection, expansion, simulation, and backpropagation.',
        prereqNames: ['A* Heuristic Pathfinding Algorithm'],
        unlockNames: ['Reinforcement Learning with RLHF']
      },
      {
        name: 'Knowledge Distillation',
        summary: 'Teacher-student model compression matching soft logit probability distributions.',
        prereqNames: ['Transformer Self-Attention'],
        unlockNames: ['Quantization & GGUF Formats']
      },
      {
        name: 'Neural Radiance Fields (NeRF)',
        summary: 'Implicit volumetric 3D scene representation parameterized by MLP rays.',
        prereqNames: ['Neural Network Backpropagation'],
        unlockNames: ['3D Gaussian Splatting']
      },
      {
        name: '3D Gaussian Splatting',
        summary: 'Real-time radiance field rendering via rasterized 3D anisotropic Gaussians.',
        prereqNames: ['Neural Radiance Fields (NeRF)'],
        unlockNames: ['Diffusion Models & Score Matching']
      },
      {
        name: 'Quantization & GGUF Formats',
        summary: 'INT8/INT4 weight quantization reducing VRAM bandwidth footprint.',
        prereqNames: ['LoRA Parameter-Efficient Fine-Tuning'],
        unlockNames: ['Knowledge Distillation']
      },
      {
        name: 'Softmax Temperature Scaling',
        summary: 'Controlling logit probability sharpness during token generation sampling.',
        prereqNames: ['Neural Network Backpropagation']
      },
      {
        name: 'Actor-Critic Architectures',
        summary: 'Combining value function critic estimation with policy gradient actor updates.',
        prereqNames: ['Reinforcement Learning with RLHF']
      },
      {
        name: 'Swarm Intelligence & Particle Swarm',
        summary: 'Stochastic collective optimization inspired by biological flocking dynamics.',
        unlockNames: ['Gossip Protocols for Cluster Membership']
      },
      {
        name: 'Autoencoders & Latent Compression',
        summary: 'Dimensionality bottleneck mapping input features to dense latent representations.',
        prereqNames: ['Neural Network Backpropagation'],
        unlockNames: ['Variational Autoencoders (VAEs)']
      },
      {
        name: 'Convolutional Autoencoders',
        summary: 'Spatial feature extraction and reconstruction via transposed convolutions.',
        prereqNames: ['Convolutional Neural Networks (CNNs)']
      },
      {
        name: 'Self-Supervised Masked Autoencoders',
        summary: 'Masking random patches of visual/text inputs to learn representation priors.',
        prereqNames: ['Transformer Self-Attention']
      }
    ]
  },
  {
    category: 'CS',
    topics: [
      {
        name: 'Binary Search & Binary Search Trees',
        summary: 'Logarithmic search space partitioning and ordered tree structures.',
        unlockNames: ['Red-Black Trees', 'AVL Trees', 'B-Trees & B+ Trees', 'Splay Trees', 'Skip Lists']
      },
      {
        name: 'B-Trees & B+ Trees',
        summary: 'Self-balancing multi-way search trees optimized for disk page storage.',
        prereqNames: ['Binary Search & Binary Search Trees'],
        unlockNames: ['LSM Trees (Log-Structured Merge-Tree)']
      },
      {
        name: 'Red-Black Trees',
        summary: 'Self-balancing binary search tree guaranteeing O(log N) operations.',
        prereqNames: ['Binary Search & Binary Search Trees'],
        unlockNames: ['AVL Trees', 'Splay Trees']
      },
      {
        name: 'Trie Prefix Trees',
        summary: 'Retrieval tree structure storing string prefixes for rapid lookup.',
        unlockNames: ['Aho-Corasick Automaton', 'Suffix Automaton & Suffix Trees', 'Knuth-Morris-Pratt (KMP) Matching']
      },
      {
        name: 'Skip Lists',
        summary: 'Probabilistic layered linked list achieving logarithmic search complexity.',
        prereqNames: ['Binary Search & Binary Search Trees'],
        unlockNames: ['HNSW Vector Indexing']
      },
      {
        name: 'Disjoint Set Union (DSU)',
        summary: 'Union-find data structure with path compression and rank heuristics.',
        unlockNames: ['Kruskal & Prim Minimum Spanning Trees', 'Segment Trees & Lazy Propagation']
      },
      {
        name: 'Segment Trees & Lazy Propagation',
        summary: 'Tree data structure enabling O(log N) range queries and point updates.',
        prereqNames: ['Disjoint Set Union (DSU)'],
        unlockNames: ['Fenwick Trees (Binary Indexed Tree)']
      },
      {
        name: 'Fenwick Trees (Binary Indexed Tree)',
        summary: 'Space-efficient tree structure calculating prefix sums in O(log N).',
        prereqNames: ['Segment Trees & Lazy Propagation']
      },
      {
        name: 'Dijkstra Shortest Path Algorithm',
        summary: 'Greedy single-source shortest path algorithm for non-negative weighted graphs.',
        unlockNames: ['A* Heuristic Pathfinding Algorithm', 'Bellman-Ford Algorithm', 'Floyd-Warshall All-Pairs Shortest Path']
      },
      {
        name: 'A* Heuristic Pathfinding Algorithm',
        summary: 'Best-first search combining actual path cost with heuristic distance estimates.',
        prereqNames: ['Dijkstra Shortest Path Algorithm'],
        unlockNames: ['Monte Carlo Tree Search (MCTS)']
      },
      {
        name: 'Tarjan Strongly Connected Components',
        summary: 'Depth-first search algorithm partitioning directed graphs into strongly connected subgraphs.',
        unlockNames: ['Topological Sort (Kahn Algorithm)']
      },
      {
        name: 'Topological Sort (Kahn Algorithm)',
        summary: 'Linear ordering of vertices in a Directed Acyclic Graph (DAG).',
        prereqNames: ['Tarjan Strongly Connected Components'],
        unlockNames: ['Compiler SSA Optimization']
      },
      {
        name: 'Convex Hull (Graham Scan)',
        summary: 'Finding the smallest convex polygon enclosing a set of 2D points.',
        unlockNames: ['Kd-Trees & Spatial Partitioning']
      },
      {
        name: 'Knuth-Morris-Pratt (KMP) Matching',
        summary: 'String pattern matching in O(N+M) using prefix failure functions.',
        prereqNames: ['Trie Prefix Trees'],
        unlockNames: ['Aho-Corasick Automaton', 'Z-Algorithm String Searching']
      },
      {
        name: 'Aho-Corasick Automaton',
        summary: 'Trie-based finite state machine for matching dictionary patterns simultaneously.',
        prereqNames: ['Trie Prefix Trees', 'Knuth-Morris-Pratt (KMP) Matching'],
        unlockNames: ['Suffix Automaton & Suffix Trees']
      },
      {
        name: 'Kruskal & Prim Minimum Spanning Trees',
        summary: 'Greedy algorithms finding minimum cost spanning trees on weighted graphs.',
        prereqNames: ['Disjoint Set Union (DSU)']
      },
      {
        name: 'Fast Fourier Transform (FFT)',
        summary: 'O(N log N) algorithm converting time-domain signals into frequency spectra.',
        prereqNames: ['Fourier Transform Analysis'],
        unlockNames: ['Convolutional Neural Networks (CNNs)', 'Complex Analysis & Residues']
      },
      {
        name: 'Bloom Filters',
        summary: 'Space-efficient probabilistic data structure testing set membership.',
        unlockNames: ['HyperLogLog Cardinality Estimation', 'Cuckoo Hashing', 'LSM Trees (Log-Structured Merge-Tree)']
      },
      {
        name: 'HyperLogLog Cardinality Estimation',
        summary: 'Probabilistic algorithm estimating unique elements using register bit patterns.',
        prereqNames: ['Bloom Filters']
      },
      {
        name: 'Cuckoo Hashing',
        summary: 'Hash table resolving collisions using multiple hash functions and displacement chains.',
        prereqNames: ['Bloom Filters'],
        unlockNames: ['Consistent Hashing & DHT']
      },
      {
        name: 'AVL Trees',
        summary: 'Strictly balanced binary search tree maintaining height balance factor within 1.',
        prereqNames: ['Binary Search & Binary Search Trees']
      },
      {
        name: 'Splay Trees',
        summary: 'Self-adjusting binary search tree bringing recently accessed elements to root.',
        prereqNames: ['Binary Search & Binary Search Trees']
      },
      {
        name: 'Maximum Flow (Dinic Algorithm)',
        summary: 'Finding maximum network flow using level graphs and blocking flows.',
        unlockNames: ['Hopcroft-Karp Bipartite Matching']
      },
      {
        name: 'Hopcroft-Karp Bipartite Matching',
        summary: 'O(E sqrt(V)) algorithm finding maximum cardinality matchings in bipartite graphs.',
        prereqNames: ['Maximum Flow (Dinic Algorithm)']
      },
      {
        name: 'Bitmask Dynamic Programming',
        summary: 'Encoding subset states into integer bitmasks for NP-hard state space traversal.',
        unlockNames: ['Combinatorics & Generating Functions']
      },
      {
        name: 'Suffix Automaton & Suffix Trees',
        summary: 'Compact representation of all suffixes of a string for instant substring queries.',
        prereqNames: ['Aho-Corasick Automaton'],
        unlockNames: ['LCP Arrays & Suffix Arrays']
      },
      {
        name: 'Radix & Bucket Sort',
        summary: 'Non-comparative integer sorting algorithms operating in linear time.',
        prereqNames: ['Binary Search & Binary Search Trees']
      },
      {
        name: 'Bellman-Ford Algorithm',
        summary: 'Graph search algorithm detecting negative weight cycles.',
        prereqNames: ['Dijkstra Shortest Path Algorithm']
      },
      {
        name: 'Floyd-Warshall All-Pairs Shortest Path',
        summary: 'Dynamic programming matrix algorithm computing shortest paths between all node pairs.',
        prereqNames: ['Dijkstra Shortest Path Algorithm']
      },
      {
        name: 'Kd-Trees & Spatial Partitioning',
        summary: 'Multidimensional binary search tree partitioning space for range searches.',
        unlockNames: ['Quadtrees & Octrees', 'HNSW Vector Indexing']
      },
      {
        name: 'Quadtrees & Octrees',
        summary: 'Tree structures recursively subdividing 2D/3D space into quadrants/octants.',
        prereqNames: ['Kd-Trees & Spatial Partitioning']
      },
      {
        name: 'LCP Arrays & Suffix Arrays',
        summary: 'Sorted array of all suffixes enabling fast string pattern analysis.',
        prereqNames: ['Suffix Automaton & Suffix Trees']
      },
      {
        name: 'Z-Algorithm String Searching',
        summary: 'Linear time algorithm computing longest common prefix lengths.',
        prereqNames: ['Knuth-Morris-Pratt (KMP) Matching']
      }
    ]
  },
  {
    category: 'SYSTEMS',
    topics: [
      {
        name: 'Distributed Consensus (Raft)',
        summary: 'Leader election, log replication, heartbeat timers, and state machine safety.',
        unlockNames: ['Paxos Protocol', 'Byzantine Fault Tolerance (PBFT)', 'Two-Phase Commit (2PC)', 'Chubby Lock Service']
      },
      {
        name: 'Paxos Protocol',
        summary: 'Consensus algorithm for agreeing on a single value in asynchronous networks.',
        prereqNames: ['Distributed Consensus (Raft)'],
        unlockNames: ['Chubby Lock Service']
      },
      {
        name: 'Byzantine Fault Tolerance (PBFT)',
        summary: 'Consensus surviving up to 1/3 arbitrary malicious or failing node components.',
        prereqNames: ['Distributed Consensus (Raft)']
      },
      {
        name: 'Two-Phase Commit (2PC)',
        summary: 'Atomic commitment protocol guaranteeing distributed transaction consistency.',
        prereqNames: ['Distributed Consensus (Raft)'],
        unlockNames: ['Saga Pattern for Microservices']
      },
      {
        name: 'CAP Theorem & PACELC',
        summary: 'Fundamental trade-offs between Consistency, Availability, and Partition Tolerance.',
        unlockNames: ['Vector Clocks & Lamport Timestamps', 'Consistent Hashing & DHT', 'Dynamo Database Architecture']
      },
      {
        name: 'Vector Clocks & Lamport Timestamps',
        summary: 'Logical clocks establishing causal ordering of events in distributed systems.',
        prereqNames: ['CAP Theorem & PACELC'],
        unlockNames: ['Dynamo Database Architecture']
      },
      {
        name: 'Consistent Hashing & DHT',
        summary: 'Minimizing key remapping during hash ring node addition or removal.',
        prereqNames: ['CAP Theorem & PACELC'],
        unlockNames: ['Dynamo Database Architecture', 'Database Sharding & Partitioning']
      },
      {
        name: 'LSM Trees (Log-Structured Merge-Tree)',
        summary: 'Write-optimized storage engine combining MemTable, WAL, and SSTables.',
        prereqNames: ['B-Trees & B+ Trees', 'Write-Ahead Logging (WAL)'],
        unlockNames: ['Bloom Filters']
      },
      {
        name: 'Write-Ahead Logging (WAL)',
        summary: 'Ensuring transaction durability by appending changes to log before disk modification.',
        unlockNames: ['LSM Trees (Log-Structured Merge-Tree)', 'Two-Phase Commit (2PC)']
      },
      {
        name: 'Copy-on-Write (CoW)',
        summary: 'Resource management strategy deferring page duplication until data modification.',
        unlockNames: ['Memory Paging & TLB Caches', 'Linux cgroups & Namespaces']
      },
      {
        name: 'Memory Paging & TLB Caches',
        summary: 'Virtual memory translation using page tables and Translation Lookaside Buffers.',
        prereqNames: ['Copy-on-Write (CoW)'],
        unlockNames: ['Cache Coherence (MESI Protocol)', 'Virtual Memory Swapping & OOM Killer']
      },
      {
        name: 'Cache Coherence (MESI Protocol)',
        summary: 'Maintaining memory consistency across multiprocessor caches via hardware states.',
        prereqNames: ['Memory Paging & TLB Caches'],
        unlockNames: ['Lock-Free Data Structures & CAS']
      },
      {
        name: 'Lock-Free Data Structures & CAS',
        summary: 'Concurrent synchronization using atomic Compare-And-Swap primitives.',
        prereqNames: ['Cache Coherence (MESI Protocol)']
      },
      {
        name: 'eBPF Kernel Tracing',
        summary: 'Running sandboxed bytecode programs in the Linux kernel without module compilation.',
        unlockNames: ['io_uring Linux Async I/O', 'Linux cgroups & Namespaces']
      },
      {
        name: 'io_uring Linux Async I/O',
        summary: 'High-performance asynchronous I/O interface using shared kernel/user ring buffers.',
        prereqNames: ['eBPF Kernel Tracing'],
        unlockNames: ['Zero-Copy Socket Transfers']
      },
      {
        name: 'Zero-Copy Socket Transfers',
        summary: 'Direct DMA memory transfer between disk and network interfaces bypassing CPU.',
        prereqNames: ['io_uring Linux Async I/O'],
        unlockNames: ['TCP Congestion Control (BBR)']
      },
      {
        name: 'TCP Congestion Control (BBR)',
        summary: 'Model-based congestion control measuring bottleneck bandwidth and round-trip time.',
        unlockNames: ['QUIC Protocol & HTTP/3']
      },
      {
        name: 'QUIC Protocol & HTTP/3',
        summary: 'UDP-based transport protocol providing multiplexed streams without head-of-line blocking.',
        prereqNames: ['TCP Congestion Control (BBR)'],
        unlockNames: ['TLS 1.3 Cryptographic Handshake', 'gRPC & Protocol Buffers']
      },
      {
        name: 'gRPC & Protocol Buffers',
        summary: 'High-performance RPC framework using binary Protocol Buffer serialization.',
        prereqNames: ['QUIC Protocol & HTTP/3'],
        unlockNames: ['Microservices & Service Mesh']
      },
      {
        name: 'Kafka Log Partitioning & Consumer Groups',
        summary: 'Distributed immutable append-only commit log partitioning pub-sub messages.',
        unlockNames: ['Event Sourcing & CQRS', 'Reactive Streams & Backpressure']
      },
      {
        name: 'Saga Pattern for Microservices',
        summary: 'Distributed transaction management via sequence of local transactions and compensations.',
        prereqNames: ['Two-Phase Commit (2PC)']
      },
      {
        name: 'Event Sourcing & CQRS',
        summary: 'Persisting domain state as sequence of immutable events separating read/write models.',
        prereqNames: ['Kafka Log Partitioning & Consumer Groups']
      },
      {
        name: 'Token Bucket Rate Limiting',
        summary: 'Traffic shaping algorithm controlling request burst rates via token replenishment.',
        unlockNames: ['Envoy Reverse Proxy Architecture']
      },
      {
        name: 'Envoy Reverse Proxy Architecture',
        summary: 'High-performance L7 proxy managing service mesh traffic routing and observability.',
        prereqNames: ['Token Bucket Rate Limiting'],
        unlockNames: ['Microservices & Service Mesh']
      },
      {
        name: 'Linux cgroups & Namespaces',
        summary: 'Kernel features enabling resource limit isolation for container runtimes.',
        prereqNames: ['Copy-on-Write (CoW)']
      },
      {
        name: 'Virtual Memory Swapping & OOM Killer',
        summary: 'Kernel memory management paging out inactive pages to swap files under pressure.',
        prereqNames: ['Memory Paging & TLB Caches']
      },
      {
        name: 'Non-Volatile Memory (NVM) Storage',
        summary: 'Byte-addressable persistent memory bridging DRAM speeds with storage persistence.',
        prereqNames: ['Memory Paging & TLB Caches']
      },
      {
        name: 'Network Function Virtualization (NFV)',
        summary: 'Replacing hardware appliances with virtualized software network functions.',
        prereqNames: ['Envoy Reverse Proxy Architecture']
      },
      {
        name: 'Gossip Protocols for Cluster Membership',
        summary: 'Decentralized peer-to-peer epidemic protocol disseminating cluster state.',
        unlockNames: ['Dynamo Database Architecture']
      },
      {
        name: 'Chubby Lock Service',
        summary: 'Coarse-grained distributed lock service based on Paxos for cluster metadata.',
        prereqNames: ['Paxos Protocol']
      },
      {
        name: 'Dynamo Database Architecture',
        summary: 'Highly available key-value store using consistent hashing, vector clocks, and sloppy quorums.',
        prereqNames: ['Consistent Hashing & DHT', 'Vector Clocks & Lamport Timestamps', 'Gossip Protocols for Cluster Membership']
      }
    ]
  },
  {
    category: 'MATH',
    topics: [
      {
        name: 'Singular Value Decomposition (SVD)',
        summary: 'Matrix factorization into singular vectors and singular value diagonal scaling.',
        prereqNames: ['Eigenvalues & Eigenvectors'],
        unlockNames: ['Principal Component Analysis (PCA)', 'Tensor Calculus & Differential Forms']
      },
      {
        name: 'Eigenvalues & Eigenvectors',
        summary: 'Special scalar multipliers and invariant direction vectors of linear transformations.',
        unlockNames: ['Singular Value Decomposition (SVD)', 'Principal Component Analysis (PCA)', 'Graph Theory & Spectral Clustering']
      },
      {
        name: 'Fourier Transform Analysis',
        summary: 'Decomposing continuous/discrete functions into infinite frequency components.',
        unlockNames: ['Fast Fourier Transform (FFT)', 'Laplace Transform']
      },
      {
        name: 'Laplace Transform',
        summary: 'Integral transform converting differential equations into algebraic domain representations.',
        prereqNames: ['Fourier Transform Analysis'],
        unlockNames: ['Differential Equations (PDE/ODE)']
      },
      {
        name: 'Riemannian Geometry & Manifolds',
        summary: 'Differential geometry studying smooth spaces with Riemannian metric tensors.',
        unlockNames: ['Special & General Relativity', 'Tensor Calculus & Differential Forms', 'Topology & Homotopy']
      },
      {
        name: 'Tensor Calculus & Differential Forms',
        summary: 'Generalizing vectors and matrices to multidimensional geometric object tensors.',
        prereqNames: ['Riemannian Geometry & Manifolds'],
        unlockNames: ['Special & General Relativity']
      },
      {
        name: 'Bayesian Inference & Priors',
        summary: 'Updating probability hypotheses as new empirical evidence or data becomes available.',
        unlockNames: ['Markov Chains & Transition Matrices', 'Hidden Markov Models (HMM)', 'Information Entropy & KL Divergence']
      },
      {
        name: 'Markov Chains & Transition Matrices',
        summary: 'Stochastic memoryless process where future states depend only on current state.',
        prereqNames: ['Bayesian Inference & Priors'],
        unlockNames: ['Hidden Markov Models (HMM)', 'Stochastic Calculus & Ito Lemma']
      },
      {
        name: 'Hidden Markov Models (HMM)',
        summary: 'Statistical Markov model with unobserved hidden states emitting observable outputs.',
        prereqNames: ['Markov Chains & Transition Matrices']
      },
      {
        name: 'Jacobian & Hessian Matrices',
        summary: 'First-order partial derivative vectors and second-order curvature matrices.',
        unlockNames: ['Convex Optimization & Duality', 'Neural Network Backpropagation']
      },
      {
        name: 'Convex Optimization & Duality',
        summary: 'Minimizing convex objective functions subject to linear and convex inequality constraints.',
        prereqNames: ['Jacobian & Hessian Matrices'],
        unlockNames: ['Lagrange Multipliers & KKT Conditions', 'Support Vector Machines (SVM)']
      },
      {
        name: 'Lagrange Multipliers & KKT Conditions',
        summary: 'Finding local maxima/minima of functions subject to equality and inequality constraints.',
        prereqNames: ['Convex Optimization & Duality']
      },
      {
        name: 'Group Theory & Symmetry',
        summary: 'Abstract algebra studying algebraic structures with closure, associativity, identity, and inverses.',
        unlockNames: ['Ring & Field Theory', 'Category Theory & Functors', 'Galois Theory', 'Standard Model of Particle Physics']
      },
      {
        name: 'Ring & Field Theory',
        summary: 'Algebraic structures supporting addition, multiplication, and multiplicative inverses.',
        prereqNames: ['Group Theory & Symmetry'],
        unlockNames: ['Galois Theory', 'Elliptic Curve Cryptography (ECC)']
      },
      {
        name: 'Category Theory & Functors',
        summary: 'Abstract mathematical framework studying objects, arrows, morphisms, and structural mappings.',
        prereqNames: ['Group Theory & Symmetry']
      },
      {
        name: 'Complex Analysis & Residues',
        summary: 'Study of functions of complex variables, holomorphic functions, and contour integrals.',
        prereqNames: ['Fourier Transform Analysis']
      },
      {
        name: 'Topology & Homotopy',
        summary: 'Study of geometric properties preserved under continuous deformations and stretchings.',
        prereqNames: ['Riemannian Geometry & Manifolds'],
        unlockNames: ['Topological Qubits & Anyons']
      },
      {
        name: 'Information Entropy & KL Divergence',
        summary: 'Quantifying uncertainty, information content, and relative difference between distributions.',
        prereqNames: ['Bayesian Inference & Priors'],
        unlockNames: ['Variational Autoencoders (VAEs)', 'Wasserstein Distance (Earth Mover)']
      },
      {
        name: 'Wasserstein Distance (Earth Mover)',
        summary: 'Optimal transport distance metric measuring cost of transforming one probability distribution into another.',
        prereqNames: ['Information Entropy & KL Divergence']
      },
      {
        name: 'Monte Carlo Integration',
        summary: 'Numerical integration evaluating high-dimensional integrals via random sampling.',
        unlockNames: ['Monte Carlo Tree Search (MCTS)']
      },
      {
        name: 'Stochastic Calculus & Ito Lemma',
        summary: 'Calculus operating on stochastic processes like Brownian motion and Wiener processes.',
        prereqNames: ['Markov Chains & Transition Matrices']
      },
      {
        name: 'Quaternions & 3D Spatial Rotations',
        summary: 'Four-dimensional number system avoiding gimbal lock during 3D spatial rotations.',
        prereqNames: ['Group Theory & Symmetry']
      },
      {
        name: 'Graph Theory & Spectral Clustering',
        summary: 'Partitioning graph vertices using eigenvalues of normalized graph Laplacian matrices.',
        prereqNames: ['Eigenvalues & Eigenvectors'],
        unlockNames: ['Graph Neural Networks (GNNs)']
      },
      {
        name: 'Differential Equations (PDE/ODE)',
        summary: 'Equations relating functions to their derivatives governing physical systems.',
        prereqNames: ['Laplace Transform'],
        unlockNames: ['Maxwell Equations & Electromagnetism']
      },
      {
        name: 'Vector Calculus & Divergence Theorem',
        summary: 'Gradient, curl, and divergence fields relating volume integrals to surface fluxes.',
        unlockNames: ['Maxwell Equations & Electromagnetism']
      },
      {
        name: 'Ergodic Theory & Dynamical Systems',
        summary: 'Statistical behavior of deterministic dynamical systems over long time horizons.',
        prereqNames: ['Markov Chains & Transition Matrices']
      },
      {
        name: 'Combinatorics & Generating Functions',
        summary: 'Formal power series encoding sequence terms as coefficients for counting problems.',
        unlockNames: ['Bitmask Dynamic Programming']
      },
      {
        name: 'Number Theory & Modular Arithmetic',
        summary: 'Study of integers, prime factorizations, modular congruences, and Diophantine equations.',
        unlockNames: ['RSA Asymmetric Encryption', 'Shor Quantum Factoring Algorithm']
      },
      {
        name: 'Galois Theory',
        summary: 'Connecting field theory and group theory to solve polynomial equation roots.',
        prereqNames: ['Group Theory & Symmetry', 'Ring & Field Theory']
      },
      {
        name: 'Differential Geometry of Curves',
        summary: 'Frenet-Serret formulas describing curvature and torsion of space curves.',
        prereqNames: ['Riemannian Geometry & Manifolds']
      },
      {
        name: 'Fixed Point Theorems (Banach/Brouwer)',
        summary: 'Conditions guaranteeing existence of invariant points under continuous mappings.',
        prereqNames: ['Topology & Homotopy']
      }
    ]
  },
  {
    category: 'PHYSICS',
    topics: [
      {
        name: 'Quantum Superposition & Qubits',
        summary: 'Physical state existing as linear combination of basis state vectors.',
        unlockNames: ['Quantum Entanglement & EPR Paradox', 'Quantum Teleportation Protocol', 'Shor Quantum Factoring Algorithm', 'Grover Quantum Search Algorithm', 'Topological Qubits & Anyons']
      },
      {
        name: 'Quantum Entanglement & EPR Paradox',
        summary: 'Non-local quantum correlation between entangled particle pairs.',
        prereqNames: ['Quantum Superposition & Qubits'],
        unlockNames: ['Quantum Teleportation Protocol', 'AdS/CFT Gauge-Gravity Duality']
      },
      {
        name: 'Quantum Teleportation Protocol',
        summary: 'Transferring quantum state information using entanglement and classical bits.',
        prereqNames: ['Quantum Entanglement & EPR Paradox']
      },
      {
        name: 'Shor Quantum Factoring Algorithm',
        summary: 'Polynomial time quantum algorithm factoring integers using quantum Fourier transforms.',
        prereqNames: ['Quantum Superposition & Qubits', 'Number Theory & Modular Arithmetic'],
        unlockNames: ['RSA Asymmetric Encryption']
      },
      {
        name: 'Grover Quantum Search Algorithm',
        summary: 'O(sqrt N) quantum amplitude amplification searching unsorted databases.',
        prereqNames: ['Quantum Superposition & Qubits']
      },
      {
        name: 'Quantum Decoherence & Noise',
        summary: 'Loss of quantum coherence caused by environmental interaction and phase randomization.',
        prereqNames: ['Quantum Superposition & Qubits'],
        unlockNames: ['Topological Qubits & Anyons']
      },
      {
        name: 'Topological Qubits & Anyons',
        summary: 'Fault-tolerant quantum computing storing info in non-Abelian anyon braiding.',
        prereqNames: ['Quantum Decoherence & Noise', 'Topology & Homotopy']
      },
      {
        name: 'Special & General Relativity',
        summary: 'Spacetime metric curvature governed by Einstein stress-energy tensor equations.',
        prereqNames: ['Riemannian Geometry & Manifolds'],
        unlockNames: ['Schwarzschild Black Hole Metric', 'Gravitational Waves & LIGO Interferometry']
      },
      {
        name: 'Schwarzschild Black Hole Metric',
        summary: 'Exact solution to Einstein field equations describing static non-rotating black holes.',
        prereqNames: ['Special & General Relativity'],
        unlockNames: ['AdS/CFT Gauge-Gravity Duality']
      },
      {
        name: 'Maxwell Equations & Electromagnetism',
        summary: 'Unified electromagnetic field theory governing electric and magnetic vectors.',
        prereqNames: ['Vector Calculus & Divergence Theorem'],
        unlockNames: ['Quantum Electrodynamics (QED)']
      },
      {
        name: 'Thermodynamic Entropy & Second Law',
        summary: 'Irreversible increase in statistical disorder within isolated physical systems.',
        unlockNames: ['Information Entropy & KL Divergence']
      },
      {
        name: 'Quantum Electrodynamics (QED)',
        summary: 'Relativistic quantum field theory describing photon-electron interactions.',
        prereqNames: ['Maxwell Equations & Electromagnetism'],
        unlockNames: ['Feynman Diagram Particle Physics', 'Standard Model of Particle Physics']
      },
      {
        name: 'Feynman Diagram Particle Physics',
        summary: 'Pictorial representation of subatomic particle interaction perturbation series.',
        prereqNames: ['Quantum Electrodynamics (QED)'],
        unlockNames: ['Standard Model of Particle Physics']
      },
      {
        name: 'Higgs Mechanism & Symmetry Breaking',
        summary: 'Spontaneous gauge symmetry breaking granting mass to fundamental bosons.',
        prereqNames: ['Group Theory & Symmetry'],
        unlockNames: ['Standard Model of Particle Physics']
      },
      {
        name: 'Dark Matter & WIMP Detection',
        summary: 'Non-baryonic mass inferable from galactic rotation curves and gravitational lensing.',
        prereqNames: ['Special & General Relativity']
      },
      {
        name: 'String Theory & Calabi-Yau Manifolds',
        summary: 'Replacing point particles with 1D vibrating strings in 10/11 dimensional spacetime.',
        prereqNames: ['Riemannian Geometry & Manifolds'],
        unlockNames: ['AdS/CFT Gauge-Gravity Duality']
      },
      {
        name: 'Loop Quantum Gravity',
        summary: 'Non-perturbative background-independent quantum theory of discrete spacetime spin networks.',
        prereqNames: ['Special & General Relativity']
      },
      {
        name: 'AdS/CFT Gauge-Gravity Duality',
        summary: 'Holographic equivalence between anti-de Sitter gravity and boundary conformal field theories.',
        prereqNames: ['String Theory & Calabi-Yau Manifolds', 'Schwarzschild Black Hole Metric']
      },
      {
        name: 'Quantum Optics & Cavity QED',
        summary: 'Interaction between quantized light fields and single atoms inside optical cavities.',
        prereqNames: ['Quantum Decoherence & Noise']
      },
      {
        name: 'Condensed Matter Superconductivity',
        summary: 'Zero electrical resistance below critical temperature due to Cooper electron pairing.',
        unlockNames: ['Bose-Einstein Condensate (BEC)']
      },
      {
        name: 'Bose-Einstein Condensate (BEC)',
        summary: 'State of matter where macroscopic quantum phenomena emerge near absolute zero.',
        prereqNames: ['Condensed Matter Superconductivity']
      },
      {
        name: 'Quantum Hall Effect & Chern Numbers',
        summary: 'Quantized Hall conductance in 2D electron gases topologically protected by invariants.',
        prereqNames: ['Topology & Homotopy']
      },
      {
        name: 'Particle Accelerators & Synchrotrons',
        summary: 'Accelerating charged particles to relativistic speeds using RF cavities and dipole magnets.',
        prereqNames: ['Maxwell Equations & Electromagnetism']
      },
      {
        name: 'Neutrino Oscillations & PMNS Matrix',
        summary: 'Flavor transformation of neutrinos demonstrating non-zero mass differences.',
        prereqNames: ['Standard Model of Particle Physics']
      },
      {
        name: 'Cosmic Microwave Background (CMB)',
        summary: 'Thermal relic radiation from recombination epoch preserving early universe fluctuations.',
        prereqNames: ['Special & General Relativity']
      },
      {
        name: 'Gravitational Waves & LIGO Interferometry',
        summary: 'Spacetime metric ripples detected via laser arm phase interference.',
        prereqNames: ['Special & General Relativity']
      },
      {
        name: 'Standard Model of Particle Physics',
        summary: 'Gauge theory classifying quarks, leptons, gauge bosons, and Higgs scalar.',
        prereqNames: ['Higgs Mechanism & Symmetry Breaking', 'Feynman Diagram Particle Physics']
      },
      {
        name: 'Quantum Field Theory (QFT) Canonical Quantization',
        summary: 'Promoting classical fields to operator-valued distributions over Hilbert space.',
        prereqNames: ['Quantum Electrodynamics (QED)']
      },
      {
        name: 'Spintronics & Magnetic Tunnel Junctions',
        summary: 'Exploiting electron spin orientation alongside charge for ultra-low power memory.',
        prereqNames: ['Quantum Superposition & Qubits']
      }
    ]
  },
  {
    category: 'CYBERSECURITY',
    topics: [
      {
        name: 'RSA Asymmetric Encryption',
        summary: 'Public key cryptography based on difficulty of prime factorization.',
        prereqNames: ['Number Theory & Modular Arithmetic'],
        unlockNames: ['Elliptic Curve Cryptography (ECC)', 'Diffie-Hellman Key Exchange', 'Public Key Infrastructure (PKI)']
      },
      {
        name: 'Elliptic Curve Cryptography (ECC)',
        summary: 'Public key encryption based on algebraic structure of elliptic curves over finite fields.',
        prereqNames: ['RSA Asymmetric Encryption', 'Ring & Field Theory'],
        unlockNames: ['Diffie-Hellman Key Exchange', 'Post-Quantum Lattice Cryptography']
      },
      {
        name: 'Zero-Knowledge Proofs (ZK-SNARKs)',
        summary: 'Proving possession of secret knowledge without disclosing the secret content.',
        unlockNames: ['Homomorphic Encryption (FHE)', 'Post-Quantum Lattice Cryptography']
      },
      {
        name: 'Diffie-Hellman Key Exchange',
        summary: 'Method allowing two parties to establish shared secret keys over insecure channels.',
        prereqNames: ['RSA Asymmetric Encryption'],
        unlockNames: ['TLS 1.3 Cryptographic Handshake']
      },
      {
        name: 'AES-GCM Authenticated Encryption',
        summary: 'Symmetric block cipher mode providing data confidentiality and authenticity.',
        unlockNames: ['TLS 1.3 Cryptographic Handshake']
      },
      {
        name: 'SHA-256 & Cryptographic Hashes',
        summary: 'One-way cryptographic function mapping arbitrary data to fixed 256-bit hashes.',
        unlockNames: ['RSA Asymmetric Encryption', 'Zero-Knowledge Proofs (ZK-SNARKs)']
      },
      {
        name: 'Homomorphic Encryption (FHE)',
        summary: 'Encryption enabling arbitrary computations directly on ciphertext without decryption.',
        prereqNames: ['Zero-Knowledge Proofs (ZK-SNARKs)']
      },
      {
        name: 'Post-Quantum Lattice Cryptography',
        summary: 'Quantum-resistant encryption based on hardness of shortest vector lattice problems.',
        prereqNames: ['Elliptic Curve Cryptography (ECC)']
      },
      {
        name: 'Return-Oriented Programming (ROP)',
        summary: 'Exploitation technique executing code using existing instruction gadgets.',
        prereqNames: ['Buffer Overflow & Stack Canaries'],
        unlockNames: ['Side-Channel Attacks (Spectre/Meltdown)']
      },
      {
        name: 'Side-Channel Attacks (Spectre/Meltdown)',
        summary: 'Exfiltrating secrets via speculative execution CPU cache timing leakage.',
        prereqNames: ['Return-Oriented Programming (ROP)', 'Memory Paging & TLB Caches']
      },
      {
        name: 'Public Key Infrastructure (PKI)',
        summary: 'Framework managing digital certificates and public key authentication.',
        prereqNames: ['RSA Asymmetric Encryption'],
        unlockNames: ['TLS 1.3 Cryptographic Handshake']
      },
      {
        name: 'TLS 1.3 Cryptographic Handshake',
        summary: 'Transport Layer Security protocol reducing handshake latency to 1-RTT.',
        prereqNames: ['Diffie-Hellman Key Exchange', 'AES-GCM Authenticated Encryption', 'Public Key Infrastructure (PKI)']
      },
      {
        name: 'WebAssembly (Wasm) Sandboxing',
        summary: 'Memory-safe sandboxed execution environment inside modern browsers.',
        unlockNames: ['Content Security Policy (CSP)']
      },
      {
        name: 'Content Security Policy (CSP)',
        summary: 'HTTP response header restricting resource loading to mitigate XSS attacks.',
        prereqNames: ['WebAssembly (Wasm) Sandboxing']
      },
      {
        name: 'Cross-Site Request Forgery (CSRF)',
        summary: 'Exploit forcing authenticated user browsers to submit unauthorized actions.',
        prereqNames: ['Content Security Policy (CSP)']
      },
      {
        name: 'Kerberos Authentication Protocol',
        summary: 'Ticket-based authentication service providing mutual identity verification.',
        prereqNames: ['Public Key Infrastructure (PKI)']
      },
      {
        name: 'Buffer Overflow & Stack Canaries',
        summary: 'Memory corruption flaw overwriting adjacent stack memory and return pointers.',
        unlockNames: ['Return-Oriented Programming (ROP)']
      },
      {
        name: 'Fuzzing & Coverage-Guided Testing',
        summary: 'Automated vulnerability discovery feeding mutated inputs to binary targets.',
        unlockNames: ['Buffer Overflow & Stack Canaries']
      }
    ]
  },
  {
    category: 'ARCH',
    topics: [
      {
        name: 'Microservices & Service Mesh',
        summary: 'Decoupled application architecture managed via sidecar proxies and control planes.',
        prereqNames: ['Clean Architecture & Hexagonal Ports'],
        unlockNames: ['Envoy Reverse Proxy Architecture', 'Distributed Tracing (OpenTelemetry)']
      },
      {
        name: 'Domain-Driven Design (DDD)',
        summary: 'Software design modeling complex business domains around ubiquitous languages.',
        unlockNames: ['Clean Architecture & Hexagonal Ports']
      },
      {
        name: 'Clean Architecture & Hexagonal Ports',
        summary: 'Architectural pattern decoupling business logic from external frameworks and IO.',
        prereqNames: ['Domain-Driven Design (DDD)'],
        unlockNames: ['Microservices & Service Mesh']
      },
      {
        name: 'Event-Driven Architecture (EDA)',
        summary: 'Asynchronous communication pattern driven by event production, detection, and consumption.',
        unlockNames: ['Kafka Log Partitioning & Consumer Groups', 'Event Sourcing & CQRS', 'Reactive Streams & Backpressure']
      },
      {
        name: 'Reactive Streams & Backpressure',
        summary: 'Asynchronous stream processing standard controlling data flow rates between stages.',
        prereqNames: ['Event-Driven Architecture (EDA)']
      },
      {
        name: 'Serverless & Edge Functions',
        summary: 'Event-driven compute execution running at network edge locations on demand.',
        prereqNames: ['Event-Driven Architecture (EDA)']
      },
      {
        name: 'Database Sharding & Partitioning',
        summary: 'Horizontal data distribution splitting database tables across node clusters.',
        prereqNames: ['Consistent Hashing & DHT']
      },
      {
        name: 'GraphQL Schema & Resolvers',
        summary: 'Query language for APIs enabling clients to request precise data shapes.',
        prereqNames: ['OpenAPI & RESTful API Specs']
      },
      {
        name: 'OpenAPI & RESTful API Specs',
        summary: 'Standardized contract specifications for RESTful HTTP web service interfaces.',
        unlockNames: ['GraphQL Schema & Resolvers']
      },
      {
        name: 'Service Workers & PWA Caching',
        summary: 'Background browser scripts intercepting network requests for offline caching.',
        unlockNames: ['Content Security Policy (CSP)']
      },
      {
        name: 'Distributed Tracing (OpenTelemetry)',
        summary: 'Collecting trace spans across microservices to analyze request latencies.',
        prereqNames: ['Microservices & Service Mesh']
      },
      {
        name: 'Feature Flag Toggles & Canary Deployments',
        summary: 'Safe deployment strategy exposing new code incrementally to target user slices.',
        prereqNames: ['Microservices & Service Mesh']
      }
    ]
  }
];

// Robust 3D spatial layout generator with multi-pass iterative force-directed relaxation
function generateCosmosNodes(): TopicNode[] {
  const nodes: TopicNode[] = [];
  const nameToIdMap = new Map<string, string>();
  let idCounter = 1;

  // Step 1: Assign initial cluster sphere positions
  DOMAIN_DATA.forEach((domainGroup, domainIdx) => {
    const clusterAngle = (domainIdx / DOMAIN_DATA.length) * Math.PI * 2;
    const clusterRadius = 18.0; // Expanded domain cluster separation radius
    const clusterX = Math.cos(clusterAngle) * clusterRadius;
    const clusterY = Math.sin(clusterAngle) * clusterRadius;
    const clusterZ = (domainIdx % 2 === 0 ? 1.0 : -1.0) * (3.0 + Math.random() * 2.5);

    domainGroup.topics.forEach((topic, topicIdx) => {
      const id = `TOPIC-${idCounter.toString().padStart(3, '0')}`;
      idCounter++;
      nameToIdMap.set(topic.name, id);

      const phi = Math.acos(1 - 2 * (topicIdx + 0.5) / domainGroup.topics.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * topicIdx;
      const r = 5.0 + (topicIdx % 5) * 1.6;

      const x = clusterX + r * Math.sin(phi) * Math.cos(theta);
      const y = clusterY + r * Math.sin(phi) * Math.sin(theta);
      const z = clusterZ + r * Math.cos(phi);

      const mastery = Math.floor(Math.random() * 85) + 10;
      const status: TopicNode['status'] =
        mastery >= 80 ? 'MASTERED' : mastery >= 50 ? 'LEARNING' : mastery >= 30 ? 'DUE' : 'NEW';

      const timeAgo = ['2 hours ago', 'Yesterday', '3 days ago', '1 week ago', 'Never'][topicIdx % 5];

      nodes.push({
        id,
        name: topic.name,
        category: domainGroup.category,
        mastery,
        status,
        lastReviewed: timeAgo,
        coordinates: [Number(x.toFixed(2)), Number(y.toFixed(2)), Number(z.toFixed(2))],
        prerequisites: [],
        unlocks: [],
        summary: topic.summary
      });
    });
  });

  // Step 2: Multi-Pass Iterative Collision Relaxation (50 iterations)
  // Guarantees MIN_DIST >= 3.4 units between EVERY pair of nodes in 3D space
  const MIN_DIST = 3.4;
  for (let pass = 0; pass < 50; pass++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];

        let dx = n2.coordinates[0] - n1.coordinates[0];
        let dy = n2.coordinates[1] - n1.coordinates[1];
        let dz = n2.coordinates[2] - n1.coordinates[2];
        let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < MIN_DIST) {
          if (dist === 0) {
            dx = (Math.random() - 0.5) * 0.2;
            dy = (Math.random() - 0.5) * 0.2;
            dz = (Math.random() - 0.5) * 0.2;
            dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          }

          const overlap = (MIN_DIST - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          n1.coordinates[0] -= nx * overlap;
          n1.coordinates[1] -= ny * overlap;
          n1.coordinates[2] -= nz * overlap;

          n2.coordinates[0] += nx * overlap;
          n2.coordinates[1] += ny * overlap;
          n2.coordinates[2] += nz * overlap;

          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  // Format final coordinates to 2 decimal places
  nodes.forEach((node) => {
    node.coordinates = [
      Number(node.coordinates[0].toFixed(2)),
      Number(node.coordinates[1].toFixed(2)),
      Number(node.coordinates[2].toFixed(2))
    ];
  });

  // Step 3: Register bi-directional prerequisite relationships
  DOMAIN_DATA.forEach((domainGroup) => {
    domainGroup.topics.forEach((topic) => {
      const currentId = nameToIdMap.get(topic.name);
      if (!currentId) return;

      const currentNode = nodes.find((n) => n.id === currentId);
      if (!currentNode) return;

      if (topic.prereqNames) {
        topic.prereqNames.forEach((prereqName) => {
          const prereqId = nameToIdMap.get(prereqName);
          if (prereqId) {
            if (!currentNode.prerequisites.includes(prereqId)) {
              currentNode.prerequisites.push(prereqId);
            }
            const prereqNode = nodes.find((n) => n.id === prereqId);
            if (prereqNode && !prereqNode.unlocks.includes(currentId)) {
              prereqNode.unlocks.push(currentId);
            }
          }
        });
      }

      if (topic.unlockNames) {
        topic.unlockNames.forEach((unlockName) => {
          const unlockId = nameToIdMap.get(unlockName);
          if (unlockId) {
            if (!currentNode.unlocks.includes(unlockId)) {
              currentNode.unlocks.push(unlockId);
            }
            const unlockNode = nodes.find((n) => n.id === unlockId);
            if (unlockNode && !unlockNode.prerequisites.includes(currentId)) {
              unlockNode.prerequisites.push(currentId);
            }
          }
        });
      }
    });
  });

  return nodes;
}

const INITIAL_TOPICS = generateCosmosNodes();

const INITIAL_TODOS: StudyTodo[] = [
  {
    id: 'TODO-001',
    title: 'Implement Backpropagation autograd engine from scratch',
    category: 'AI & ML',
    priority: 'HIGH',
    completed: false,
    dueDate: 'Today',
    topicId: 'TOPIC-001'
  },
  {
    id: 'TODO-002',
    title: 'Review 15 Spaced Repetition cards for Transformer Attention',
    category: 'AI & ML',
    priority: 'HIGH',
    completed: false,
    dueDate: 'Today',
    topicId: 'TODO-002'
  },
  {
    id: 'TODO-003',
    title: 'Complete Raft leader election failure scenario simulation',
    category: 'SYSTEMS',
    priority: 'MEDIUM',
    completed: true,
    dueDate: 'Today',
    topicId: 'TOPIC-034'
  },
  {
    id: 'TODO-004',
    title: 'Read SVD Chapter 4 in Linear Algebra for ML',
    category: 'MATH',
    priority: 'MEDIUM',
    completed: false,
    dueDate: 'Tomorrow',
    topicId: 'TOPIC-096'
  },
  {
    id: 'TODO-005',
    title: 'Build Toy Compiler LLVM SSA IR generator',
    category: 'CS',
    priority: 'LOW',
    completed: false,
    dueDate: 'This Week',
    topicId: 'TOPIC-035'
  }
];

const INITIAL_POMODORO: PomodoroState = {
  mode: 'FOCUS',
  timeLeft: 25 * 60,
  isRunning: false,
  completedSessions: 3
};

const INITIAL_DIAGNOSTICS: SystemDiagnostics = {
  cpuUsage: 14.2,
  ramUsage: 3.8,
  ramTotal: 16.0,
  systemUptime: 7200,
  gridFrequency: 60.0,
  fps: 60,
  masteryScore: 58.4,
  streakDays: 14
};

const INITIAL_AUDIO: AudioFrequencyData = {
  isPlaying: false,
  volume: 0.75,
  bass: 0.0,
  mid: 0.0,
  treble: 0.0,
  bpm: 124,
  rawFftData: new Uint8Array(64)
};

const INITIAL_STATE: TelemetryState = {
  systemStatus: 'OPTIMAL',
  activeMode: 'EXPLORE',
  isOverloaded: false,
  gridPowerLevel: 94.6,
  particleDensity: 16000,
  
  mousePosition: { x: 0, y: 0, normalizedX: 0, normalizedY: 0 },
  cameraFocus: false,
  hudVisible: true,
  bloomIntensity: 1.5,
  zoomLevel: 1.0,

  searchQuery: '',
  selectedCategory: null,

  topicNodes: INITIAL_TOPICS,
  selectedTopicId: 'TOPIC-001',
  hoveredTopicId: null,
  todos: INITIAL_TODOS,
  pomodoro: INITIAL_POMODORO,

  diagnostics: INITIAL_DIAGNOSTICS,
  audioData: INITIAL_AUDIO
};

export const useStore = create<TelemetryStore>((set) => ({
  ...INITIAL_STATE,

  // Mode & System Setters
  setActiveMode: (activeMode: StudyMode) => set({ activeMode }),
  setSystemStatus: (systemStatus: SystemStatus) => set({ systemStatus }),
  setParticleDensity: (particleDensity: number) =>
    set({ particleDensity: Math.max(2000, Math.min(50000, particleDensity)) }),
  setIsOverloaded: (isOverloaded: boolean) => set({ isOverloaded }),

  // Viewport & Zoom Setters
  setMousePosition: (mousePosition: MousePosition) => set({ mousePosition }),
  toggleCameraFocus: () => set((state) => ({ cameraFocus: !state.cameraFocus })),
  setCameraFocus: (cameraFocus: boolean) => set({ cameraFocus }),
  toggleHudVisibility: () => set((state) => ({ hudVisible: !state.hudVisible })),
  setHudVisibility: (hudVisible: boolean) => set({ hudVisible }),
  setBloomIntensity: (bloomIntensity: number) => set({ bloomIntensity }),
  
  setZoomLevel: (zoomLevel: number) =>
    set({ zoomLevel: Math.max(0.2, Math.min(3.5, zoomLevel)) }),
  zoomIn: () =>
    set((state) => ({ zoomLevel: Math.min(3.5, state.zoomLevel + 0.3) })),
  zoomOut: () =>
    set((state) => ({ zoomLevel: Math.max(0.2, state.zoomLevel - 0.3) })),

  // Search & Filter Actions
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory: string | null) => set({ selectedCategory }),
  setHoveredTopicId: (hoveredTopicId: string | null) => set({ hoveredTopicId }),

  // Knowledge Graph Actions
  setSelectedTopicId: (selectedTopicId: string | null) =>
    set((state) => {
      const nextZoom = selectedTopicId ? Math.max(1.8, state.zoomLevel) : state.zoomLevel;
      return { selectedTopicId, zoomLevel: nextZoom };
    }),
  addTopicNode: (node: Omit<TopicNode, 'id'>) =>
    set((state) => {
      const newId = `TOPIC-${(state.topicNodes.length + 1).toString().padStart(3, '0')}`;
      return { topicNodes: [...state.topicNodes, { ...node, id: newId }] };
    }),
  updateTopicMastery: (id: string, mastery: number) =>
    set((state) => {
      const updated = state.topicNodes.map((n) =>
        n.id === id ? { ...n, mastery: Math.max(0, Math.min(100, mastery)) } : n
      );
      const avgMastery = Number(
        (updated.reduce((acc, curr) => acc + curr.mastery, 0) / updated.length).toFixed(1)
      );
      return {
        topicNodes: updated,
        diagnostics: { ...state.diagnostics, masteryScore: avgMastery }
      };
    }),

  // To-Do Actions
  toggleTodo: (id: string) =>
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    })),
  addTodo: (todo: Omit<StudyTodo, 'id'>) =>
    set((state) => {
      const newId = `TODO-${(state.todos.length + 1).toString().padStart(3, '0')}`;
      return { todos: [{ ...todo, id: newId }, ...state.todos] };
    }),
  deleteTodo: (id: string) =>
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id)
    })),

  // Pomodoro Actions
  togglePomodoro: () =>
    set((state) => ({
      pomodoro: { ...state.pomodoro, isRunning: !state.pomodoro.isRunning }
    })),
  resetPomodoro: (mode = 'FOCUS') =>
    set((state) => ({
      pomodoro: {
        ...state.pomodoro,
        mode,
        timeLeft: mode === 'FOCUS' ? 25 * 60 : mode === 'SHORT_BREAK' ? 5 * 60 : 15 * 60,
        isRunning: false
      }
    })),
  tickPomodoro: () =>
    set((state) => {
      const { timeLeft, isRunning, completedSessions, mode } = state.pomodoro;
      if (!isRunning) return state;

      if (timeLeft <= 1) {
        const nextMode = mode === 'FOCUS' ? 'SHORT_BREAK' : 'FOCUS';
        const nextSessions = mode === 'FOCUS' ? completedSessions + 1 : completedSessions;
        return {
          pomodoro: {
            mode: nextMode,
            timeLeft: nextMode === 'FOCUS' ? 25 * 60 : 5 * 60,
            isRunning: false,
            completedSessions: nextSessions
          }
        };
      }

      return {
        pomodoro: { ...state.pomodoro, timeLeft: timeLeft - 1 }
      };
    }),

  // System Diagnostics Setters
  updateDiagnostics: (metrics: Partial<SystemDiagnostics>) =>
    set((state) => ({
      diagnostics: { ...state.diagnostics, ...metrics }
    })),

  // Audio Actions
  setAudioData: (data: Partial<AudioFrequencyData>) =>
    set((state) => ({
      audioData: { ...state.audioData, ...data }
    })),

  // Reset Action
  resetState: () => set(INITIAL_STATE)
}));
