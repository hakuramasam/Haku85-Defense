import React, { useState, useRef, useEffect } from 'react';
import { useConnect, useAccount, useDisconnect, useConfig, useReadContract } from 'wagmi';
import { writeContract, waitForTransactionReceipt } from 'wagmi/actions';
import { parseUnits } from 'viem';
import { base } from 'wagmi/chains';

const HAKU_TOKEN = '0xf21ec85ce0b05640436ffd7e8fabba5d82eb0774';
const ENTRY_FEE = '10000';
const API_BASE_URL = 'https://lkkmslhlpkiippnjzizc.supabase.co/functions/v1';

const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
];

function Home() {
  const Leaderboard = window.Leaderboard;
  const { connectors, connect } = useConnect();
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const [gameStarted, setGameStarted] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [playerStats, setPlayerStats] = useState(null);
  const dialogRef = useRef(null);
  const gameContainerRef = useRef(null);
  const wagmiConfig = useConfig();
  const gameInstanceRef = useRef(null);

  const { data: balance } = useReadContract({
    address: HAKU_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId: base.id,
  });

  const { data: decimals } = useReadContract({
    address: HAKU_TOKEN,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: true },
    chainId: base.id,
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: HAKU_TOKEN,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, address] : undefined,
    query: { enabled: !!address },
    chainId: base.id,
  });

  useEffect(() => {
    if (address) {
      loadPlayerStats();
    }
  }, [address]);

  const loadPlayerStats = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/game-api/${address}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setPlayerStats(result.data);
      }
    } catch (error) {
      console.error('Error loading player stats:', error);
    }
  };

  const saveGameScore = async (score, wave, walletAddress) => {
    try {
      const response = await fetch(`${API_BASE_URL}/game-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          score,
          wave,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Score saved successfully:', result.data);
        await loadPlayerStats();
        
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('scoreUpdated'));
        }
      } else {
        console.error('Failed to save score:', result);
      }
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const handleStartGame = async () => {
    if (!address || !decimals) return;

    const entryFeeWei = parseUnits(ENTRY_FEE, decimals);
    
    if (balance < entryFeeWei) {
      alert(`Insufficient $HAKU85 balance. You need ${ENTRY_FEE} $HAKU85 to play.`);
      return;
    }

    setIsApproving(true);
    try {
      if (!allowance || allowance < entryFeeWei) {
        const approvalHash = await writeContract(wagmiConfig, {
          address: HAKU_TOKEN,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [address, entryFeeWei],
          chainId: base.id,
        });

        await waitForTransactionReceipt(wagmiConfig, { hash: approvalHash, chainId: base.id });
        refetchAllowance();
      }

      setGameStarted(true);
      setTimeout(() => initGame(), 100);
    } catch (error) {
      console.error('Error approving tokens:', error);
      alert('Failed to approve tokens. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const initGame = () => {
    if (!gameContainerRef.current || gameInstanceRef.current) return;

    const config = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: 800,
      height: 600,
      backgroundColor: '#141616',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update
      }
    };

    gameInstanceRef.current = new Phaser.Game(config);

    let towers = [];
    let enemies = [];
    let bullets = [];
    let wave = 0;
    let score = 0;
    let lives = 20;
    let gold = 100;
    let gameOver = false;
    let waveInProgress = false;
    let scoreText, waveText, livesText, goldText, gameOverText;
    let towerCost = 50;
    let selectedTowerType = 'basic';

    function preload() {
      this.load.image('tower', 'assets/tower.webp');
      this.load.image('enemy', 'assets/enemy.webp');
      this.load.image('bullet', 'assets/bullet.webp');
    }

    function create() {
      scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '20px', fill: '#90B5FF' });
      waveText = this.add.text(16, 46, 'Wave: 0', { fontSize: '20px', fill: '#ae75fb' });
      livesText = this.add.text(16, 76, 'Lives: 20', { fontSize: '20px', fill: '#ff6b6b' });
      goldText = this.add.text(16, 106, 'Gold: 100', { fontSize: '20px', fill: '#ffd700' });

      const startWaveBtn = this.add.text(650, 16, 'Start Wave', {
        fontSize: '18px',
        fill: '#ffffff',
        backgroundColor: '#be0eff',
        padding: { x: 12, y: 8 }
      }).setInteractive();

      startWaveBtn.on('pointerdown', () => {
        if (!waveInProgress && !gameOver) {
          startWave.call(this);
        }
      });

      const buildTowerBtn = this.add.text(650, 60, `Build Tower (${towerCost}g)`, {
        fontSize: '16px',
        fill: '#ffffff',
        backgroundColor: '#8fb4ff',
        padding: { x: 10, y: 6 }
      }).setInteractive();

      buildTowerBtn.on('pointerdown', () => {
        if (gold >= towerCost && !gameOver) {
          selectedTowerType = 'basic';
          this.input.once('pointerdown', (pointer) => {
            if (pointer.x < 600 && pointer.y > 140) {
              placeTower.call(this, pointer.x, pointer.y);
            }
          });
        }
      });

      this.add.rectangle(0, 140, 800, 2, 0xae75fb);
    }

    function startWave() {
      if (waveInProgress || gameOver) return;
      
      wave++;
      waveInProgress = true;
      waveText.setText(`Wave: ${wave}`);

      const enemyCount = 5 + wave * 2;
      const enemyHealth = 50 + wave * 10;
      const enemySpeed = 50 + wave * 5;

      for (let i = 0; i < enemyCount; i++) {
        this.time.delayedCall(i * 1000, () => {
          spawnEnemy.call(this, enemyHealth, enemySpeed);
        });
      }

      this.time.delayedCall((enemyCount + 5) * 1000, () => {
        if (enemies.length === 0) {
          waveInProgress = false;
          gold += 50 + wave * 10;
          goldText.setText(`Gold: ${gold}`);
        }
      });
    }

    function spawnEnemy(health, speed) {
      if (gameOver) return;

      const enemy = this.physics.add.sprite(-50, 200 + Phaser.Math.Between(-50, 200), 'enemy');
      enemy.setScale(0.3);
      enemy.health = health;
      enemy.maxHealth = health;
      enemy.speed = speed;
      enemy.setVelocityX(speed);
      enemies.push(enemy);
    }

    function placeTower(x, y) {
      if (gold < towerCost || gameOver) return;

      const tower = this.physics.add.sprite(x, y, 'tower');
      tower.setScale(0.4);
      tower.range = 150;
      tower.damage = 20;
      tower.fireRate = 1000;
      tower.lastFired = 0;
      towers.push(tower);

      gold -= towerCost;
      goldText.setText(`Gold: ${gold}`);

      const rangeCircle = this.add.circle(x, y, tower.range, 0xae75fb, 0.1);
      rangeCircle.setStrokeStyle(2, 0xae75fb, 0.3);
    }

    function update(time) {
      if (gameOver) return;

      enemies.forEach((enemy, eIndex) => {
        if (!enemy.active) return;

        if (enemy.x > 850) {
          lives--;
          livesText.setText(`Lives: ${lives}`);
          enemy.destroy();
          enemies.splice(eIndex, 1);

          if (lives <= 0) {
            endGame.call(this);
          }
          return;
        }

        const healthBarWidth = 40;
        const healthBarHeight = 4;
        if (enemy.healthBar) enemy.healthBar.destroy();
        if (enemy.healthBarBg) enemy.healthBarBg.destroy();

        enemy.healthBarBg = this.add.rectangle(
          enemy.x, enemy.y - 30, healthBarWidth, healthBarHeight, 0x000000, 0.5
        );
        const healthPercent = enemy.health / enemy.maxHealth;
        enemy.healthBar = this.add.rectangle(
          enemy.x - healthBarWidth/2 + (healthBarWidth * healthPercent)/2,
          enemy.y - 30,
          healthBarWidth * healthPercent,
          healthBarHeight,
          0xff0000
        );
      });

      towers.forEach(tower => {
        if (!tower.active) return;

        if (time - tower.lastFired > tower.fireRate) {
          const target = findNearestEnemy(tower);
          if (target) {
            fireBullet.call(this, tower, target);
            tower.lastFired = time;
          }
        }
      });

      bullets.forEach((bullet, bIndex) => {
        if (!bullet.active) return;

        const target = bullet.target;
        if (!target || !target.active) {
          bullet.destroy();
          bullets.splice(bIndex, 1);
          return;
        }

        const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, target.x, target.y);
        bullet.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);

        const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, target.x, target.y);
        if (distance < 20) {
          target.health -= bullet.damage;
          
          if (target.health <= 0) {
            score += 10;
            gold += 5;
            scoreText.setText(`Score: ${score}`);
            goldText.setText(`Gold: ${gold}`);
            target.destroy();
            if (target.healthBar) target.healthBar.destroy();
            if (target.healthBarBg) target.healthBarBg.destroy();
            const idx = enemies.indexOf(target);
            if (idx > -1) enemies.splice(idx, 1);
          }

          bullet.destroy();
          bullets.splice(bIndex, 1);
        }
      });

      if (!waveInProgress && enemies.length === 0 && wave > 0) {
        waveInProgress = false;
      }
    }

    function findNearestEnemy(tower) {
      let nearest = null;
      let minDist = tower.range;

      enemies.forEach(enemy => {
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = enemy;
        }
      });

      return nearest;
    }

    function fireBullet(tower, target) {
      const bullet = this.physics.add.sprite(tower.x, tower.y, 'bullet');
      bullet.setScale(0.2);
      bullet.target = target;
      bullet.damage = tower.damage;
      bullets.push(bullet);
    }

    function endGame() {
      gameOver = true;
      gameOverText = this.add.text(400, 300, `Game Over!\nFinal Score: ${score}\nWave: ${wave}`, {
        fontSize: '32px',
        fill: '#ff6b6b',
        align: 'center',
        backgroundColor: '#000000',
        padding: { x: 20, y: 20 }
      }).setOrigin(0.5);

      saveGameScore(score, wave, address);

      this.time.delayedCall(3000, () => {
        if (gameInstanceRef.current) {
          gameInstanceRef.current.destroy(true);
          gameInstanceRef.current = null;
        }
        setGameStarted(false);
      });
    }
  };

  useEffect(() => {
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#141616] text-white p-4 md:p-8 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#bb00ff]/20 blur-[100px]"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-[#90B5FF]/20 blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-6xl font-bold bg-linear-to-l from-[#bb00ff] to-[#90B5FF] bg-clip-text text-transparent mb-4 [text-shadow:_0px_0px_30px_rgb(135_70_235_/_0.5)]">
            HAKU Tower Defense
          </h1>
          <p className="text-xl text-gray-400">Defend your base and climb the leaderboard!</p>
        </div>

        <div className="glass-morphism rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ae75fb] to-[#90B5FF]">
                Entry Fee: {ENTRY_FEE} $HAKU85
              </h2>
              {chainId !== base.id && isConnected && (
                <p className="text-sm text-red-400 mt-1">⚠️ Please switch to Base network</p>
              )}
            </div>
            {isConnected ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Balance</p>
                  <p className="font-mono text-lg text-[#90B5FF]">
                    {balance && decimals ? (Number(balance) / Math.pow(10, Number(decimals))).toLocaleString() : '0'} $HAKU85
                  </p>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="px-4 py-2 bg-[#343434] hover:bg-[#444444] text-white rounded-lg transition-all duration-300 border border-[#4e4e4e]"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => dialogRef.current?.showModal()}
                className="rounded-lg border border-[#be0eff] bg-black/80 px-6 py-3 shadow-[-2px_2px_0px_0px_rgba(61,16,122,1.00)] hover:shadow-[-4px_4px_0px_0px_rgba(61,16,122,1.00)] transition-all duration-300"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {playerStats && (
            <div className="mt-4 pt-4 border-t border-[#ae75fb]/30">
              <h3 className="text-sm font-bold text-gray-400 mb-2">Your Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Best Score</p>
                  <p className="text-lg font-bold text-[#90B5FF]">{playerStats.best_score?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Best Wave</p>
                  <p className="text-lg font-bold text-[#ae75fb]">{playerStats.best_wave || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Games</p>
                  <p className="text-lg font-bold text-yellow-400">{playerStats.total_games || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Played</p>
                  <p className="text-lg font-bold text-gray-300">
                    {playerStats.last_played ? new Date(playerStats.last_played).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!gameStarted ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-morphism rounded-lg p-6">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#be0eff] to-[#8fb4ff] mb-4">
                How to Play
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#ae75fb] mt-1">▹</span>
                  <span>Click "Build Tower" to place defensive towers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ae75fb] mt-1">▹</span>
                  <span>Towers automatically shoot nearby enemies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ae75fb] mt-1">▹</span>
                  <span>Start waves to spawn enemies and earn gold</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ae75fb] mt-1">▹</span>
                  <span>Don't let enemies reach the end!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ae75fb] mt-1">▹</span>
                  <span>Survive as long as possible for high scores</span>
                </li>
              </ul>
              
              {isConnected && chainId === base.id && (
                <button
                  onClick={handleStartGame}
                  disabled={isApproving}
                  className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-[#be0eff] to-[#8fb4ff] rounded-lg font-bold text-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isApproving ? 'Approving...' : 'Start Game'}
                </button>
              )}
            </div>

            <Leaderboard />
          </div>
        ) : (
          <div className="glass-morphism rounded-lg p-6">
            <div ref={gameContainerRef} className="mx-auto" style={{ maxWidth: '800px' }}></div>
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        className="m-auto bg-transparent border-none p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="glass-morphism p-6 rounded-lg shadow-[-8px_8px_0px_0px_rgba(61,16,122,1.00)] animate-pulse-glow">
          <div className="flex justify-between items-center mb-4 gap-4">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#be0eff] to-[#8fb4ff]">
              Connect Wallet
            </h2>
            <button
              onClick={() => dialogRef.current?.close()}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="mx-auto flex flex-wrap justify-center gap-4 w-fit min-w-[200px] max-w-[500px]">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => {
                  connect({ connector });
                  dialogRef.current?.close();
                }}
                className="min-w-[180px] max-w-[250px] flex-1 p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-[#ae75fb]/30 hover:border-[#ae75fb]/60 flex items-center gap-4 group"
              >
                <div className="size-6">
                  <img
                    src={connector.icon ?? './assets/wallet.svg'}
                    alt={connector.name}
                  />
                </div>
                <span className="text-lg font-medium group-hover:scale-105 transition-transform">
                  {connector.name === 'Injected' ? 'Default Wallet' : connector.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </dialog>
    </div>
  );
}

window.Home = Home;