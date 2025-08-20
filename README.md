# Wizard Card Game Scoring App

This project is a Wizard card game scoring application built with TypeScript and React. It allows users to input and manage scores for players in a game of Wizard.

## Features

- Input scores for each player
- Display current scores on a scoreboard
- Start a new game and reset scores
- User-friendly interface for managing game controls

## Project Structure

```
wizard-score-app
├── src
│   ├── App.ts                # Main entry point of the application
│   ├── components            # Contains React components
│   │   ├── Scoreboard.tsx    # Displays current scores
│   │   ├── PlayerInput.tsx    # Inputs scores for players
│   │   └── GameControls.tsx   # Controls for starting and resetting the game
│   ├── utils                 # Utility functions for scoring
│   │   └── scoring.ts        # Scoring logic
│   └── types                 # TypeScript types and interfaces
│       └── index.ts         # Type definitions
├── package.json              # NPM configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/wizard-score-app.git
   ```
2. Navigate to the project directory:
   ```
   cd wizard-score-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run:
```
npm start
```

This will launch the app in your default web browser.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.