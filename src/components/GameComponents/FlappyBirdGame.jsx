import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import styled from "styled-components";
import { FiVolume2, FiVolumeX } from "react-icons/fi";

const BIRD_HEIGHT = 28;
const BIRD_WIDTH = 33;
const GRAVITY = 900;
const JUMP_STRENGTH = -300;
const OBJ_WIDTH = 55;
const OBJ_SPEED = 200;
const MIN_PIPE_GAP = 140;
const MAX_PIPE_GAP = 200;

const getCurrentPipeGap = (score) => {
  const decrease = Math.floor(score / 10) * 10;
  return Math.max(MIN_PIPE_GAP, MAX_PIPE_GAP - decrease);
};

const STORAGE_KEY = "flappyGameState";

const FlappyBirdGame = forwardRef(
  (
    {
      birdImage = "./images/bird.png",
      pipeImage = "./images/pipe.png",
      backgroundImage = "./images/bg.png",
      onGameEnd,
    },
    ref
  ) => {
    const [gameHeight, setGameHeight] = useState(window.innerHeight);
    const gameWidth = 360;

    const [isPaused, setIsPaused] = useState(false);

    // Sound enabled state (default true or from localStorage)
    const [soundEnabled, setSoundEnabled] = useState(() => {
      const saved = localStorage.getItem("flappySoundEnabled");
      return saved === null ? true : JSON.parse(saved);
    });

    // Audio ref for score sound
    const scoreAudio = useRef(null);

    // // Initialize audio once
    // useEffect(() => {
    //   scoreAudio.current = new Audio("/sounds/score.mp3");
    //   scoreAudio.current.muted = !soundEnabled;
    // }, []);

    // Handle sound enabled toggling
    useEffect(() => {
      if (scoreAudio.current) {
        scoreAudio.current.muted = !soundEnabled;
        if (!soundEnabled) {
          scoreAudio.current.pause();
          scoreAudio.current.currentTime = 0;
        }
      }
      localStorage.setItem("flappySoundEnabled", JSON.stringify(soundEnabled));
    }, [soundEnabled]);

    // Game state refs
    const birdY = useRef(gameHeight / 2);
    const birdVelocity = useRef(0);
    const pipes = useRef([]);
    const pipeSpawnTimer = useRef(0);
    const isGameOver = useRef(false);
    const isStarted = useRef(false);

    // Animation frame id
    const gameLoopId = useRef(null);

    // Render states (to trigger React re-render)
    const [renderBirdY, setRenderBirdY] = useState(birdY.current);
    const [renderPipes, setRenderPipes] = useState([]);
    const [score, setScore] = useState(0);
    const scoreRef = useRef(0);
    const [gameOver, setGameOver] = useState(false);

    // Save game state to localStorage
    const saveGameState = () => {
      if (isGameOver.current) return; // Don't save after game ended
      const state = {
        birdY: birdY.current,
        birdVelocity: birdVelocity.current,
        pipes: pipes.current,
        pipeSpawnTimer: pipeSpawnTimer.current,
        score: scoreRef.current,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };

    // Load saved game state if any
    const loadGameState = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const state = JSON.parse(saved);
          birdY.current = state.birdY ?? gameHeight / 2;
          birdVelocity.current = state.birdVelocity ?? 0;
          pipes.current = state.pipes ?? [];
          pipeSpawnTimer.current = state.pipeSpawnTimer ?? 0;
          scoreRef.current = state.score ?? 0;

          setRenderBirdY(birdY.current);
          setRenderPipes([...pipes.current]);
          setScore(scoreRef.current);

          isGameOver.current = false;
          isStarted.current = true;
          setGameOver(false);
          setIsPaused(false);
          return true;
        } catch {
          // ignore errors and start fresh
          return false;
        }
      }
      return false;
    };

    // End the game
    const endGame = () => {
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current);
        gameLoopId.current = null;
      }
      isGameOver.current = true;
      isStarted.current = false;
      setGameOver(true);
      localStorage.removeItem(STORAGE_KEY); // clear saved state on game over
      onGameEnd && onGameEnd(scoreRef.current);
    };

    // Start or restart the game
    const startGame = () => {
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current);
        gameLoopId.current = null;
      }
      birdY.current = gameHeight / 2;
      birdVelocity.current = 0;
      pipes.current = [];
      pipeSpawnTimer.current = 0;
      isGameOver.current = false;
      isStarted.current = true;
      scoreRef.current = 0;
      setScore(0);
      setGameOver(false);
      setIsPaused(false);
      localStorage.removeItem(STORAGE_KEY); // clear saved state on fresh start

      let lastTime = performance.now();

      const loop = (time) => {
        if (isPaused) {
          gameLoopId.current = requestAnimationFrame(loop);
          return;
        }

        const dt = (time - lastTime) / 1000;
        lastTime = time;

        // Physics update
        birdVelocity.current += GRAVITY * dt;
        birdY.current += birdVelocity.current * dt;

        // Clamp bird position
        if (birdY.current < 0) birdY.current = 0;
        if (birdY.current + BIRD_HEIGHT > gameHeight)
          birdY.current = gameHeight - BIRD_HEIGHT;

        // Check collision with ground or ceiling
        if (birdY.current === 0 || birdY.current + BIRD_HEIGHT === gameHeight) {
          endGame();
          return;
        }

        // Spawn pipes
        pipeSpawnTimer.current += dt;
        if (pipeSpawnTimer.current > 1.5) {
          pipeSpawnTimer.current = 0;
          const gap = getCurrentPipeGap(scoreRef.current);
          const minTop = 80;
          const maxTop = gameHeight - gap - 80;
          const top = Math.random() * (maxTop - minTop) + minTop;

          pipes.current.push({ x: gameWidth, top, gap, scored: false });
        }

        // Update pipes position and remove offscreen pipes
        pipes.current = pipes.current
          .map((pipe) => ({ ...pipe, x: pipe.x - OBJ_SPEED * dt }))
          .filter((pipe) => pipe.x + OBJ_WIDTH > 0);

        // Collision and scoring
        pipes.current.forEach((pipe) => {
          const birdLeft = 100;
          const birdRight = birdLeft + BIRD_WIDTH;
          const pipeLeft = pipe.x;
          const pipeRight = pipe.x + OBJ_WIDTH;

          // Collision detection
          if (
            birdRight > pipeLeft &&
            birdLeft < pipeRight &&
            (birdY.current < pipe.top ||
              birdY.current + BIRD_HEIGHT > pipe.top + pipe.gap)
          ) {
            endGame();
          }

          // Scoring
          if (!pipe.scored && pipe.x + OBJ_WIDTH < birdLeft) {
            pipe.scored = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);

            if (soundEnabled && scoreAudio.current) {
              scoreAudio.current.currentTime = 0;
              scoreAudio.current.play().catch(() => {});
            }
          }
        });

        setRenderBirdY(birdY.current);
        setRenderPipes([...pipes.current]);

        // Save game state every frame
        saveGameState();

        if (!isGameOver.current) {
          gameLoopId.current = requestAnimationFrame(loop);
        }
      };

      gameLoopId.current = requestAnimationFrame(loop);
    };

    // Start game with saved state if available on mount
useEffect(() => {
  const restored = loadGameState();
  if (restored) {
    startGame(); // this already starts the loop
  }
}, []); // ✅ only run once on mount

    // Player jump handler
    const handleJump = () => {
        if (!scoreAudio.current) {
    scoreAudio.current = new Audio("/sounds/score.mp3");
    scoreAudio.current.muted = !soundEnabled;
  }
      if (!isStarted.current && !isGameOver.current) {
        startGame();
      }
      birdVelocity.current = JUMP_STRENGTH;
    };

    // Setup event listeners for spacebar and clicks
    useEffect(() => {
      const keyHandler = (e) => {
        if (e.code === "Space") handleJump();
      };
      window.addEventListener("keydown", keyHandler);
      window.addEventListener("click", handleJump);

      return () => {
        window.removeEventListener("keydown", keyHandler);
        window.removeEventListener("click", handleJump);
        if (gameLoopId.current) {
          cancelAnimationFrame(gameLoopId.current);
        }
      };
    }, []);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      restart: () => {
        if (!isGameOver.current) return;
        localStorage.removeItem(STORAGE_KEY); // clear saved state on restart
        startGame();
      },
      pauseGame: () => {
        setIsPaused(true);
      },
      resumeGame: () => {
        setIsPaused(false);
      },
    }));

    return (
      <Home>
        <Background height={gameHeight} width={gameWidth} bg={backgroundImage}>
          <SpeakerToggle
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle Sound"
          >
            {soundEnabled ? <FiVolume2 size={22} /> : <FiVolumeX size={22} />}
          </SpeakerToggle>

          <ScoreShow>Score: {score}</ScoreShow>
          {gameOver && (
            <Startboard>Game Over! Click or Press Space to Restart</Startboard>
          )}

          {renderPipes.map((pipe, i) => (
            <React.Fragment key={i}>
              <Obj
                width={OBJ_WIDTH}
                height={pipe.top}
                left={pipe.x}
                top={0}
                deg={180}
                img={pipeImage}
              />
              <Obj
                width={OBJ_WIDTH}
                height={gameHeight - pipe.top - pipe.gap}
                left={pipe.x}
                top={pipe.top + pipe.gap}
                deg={0}
                img={pipeImage}
              />
            </React.Fragment>
          ))}

          <Bird
            width={BIRD_WIDTH}
            height={BIRD_HEIGHT}
            top={renderBirdY}
            left={100}
            img={birdImage}
          />
        </Background>
      </Home>
    );
  }
);

export default FlappyBirdGame;

const Home = styled.div`
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: inherit;
`;

const Background = styled.div.attrs(({ height, width, bg }) => ({
  style: {
    height: `${height}px`,
    width: `${width}px`,
    backgroundImage: `url(${bg})`,
  },
}))`
  position: relative;
  background-size: cover;
  background-position: center;
  overflow: hidden;
`;

const Bird = styled.div.attrs(({ width, height, top, left, img }) => ({
  style: {
    width: `${width}px`,
    height: `${height}px`,
    top: `${top}px`,
    left: `${left}px`,
    backgroundImage: `url(${img})`,
  },
}))`
  position: absolute;
  background-size: contain;
  background-repeat: no-repeat;
`;

const Obj = styled.div.attrs(({ width, height, top, left, deg, img }) => ({
  style: {
    width: `${width}px`,
    height: `${height}px`,
    top: `${top}px`,
    left: `${left}px`,
    transform: `rotate(${deg}deg)`,
    backgroundImage: `url(${img})`,
  },
}))`
  position: absolute;
  background-size: cover;
  background-repeat: no-repeat;
`;

const ScoreShow = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 3px black;
`;

const Startboard = styled.div`
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  color: white;
  text-shadow: 1px 1px 2px black;
  background: rgba(0, 0, 0, 0.4);
  padding: 10px 16px;
  border-radius: 12px;
`;

const SpeakerToggle = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  svg {
    pointer-events: none;
  }
`;
