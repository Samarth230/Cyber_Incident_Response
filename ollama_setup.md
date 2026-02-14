# Ollama Setup Instructions

Ollama is a local LLM runtime that allows you to run AI models completely offline on your machine.

## Why Ollama?

- ✅ 100% offline - no data sent externally
- ✅ Free and open source
- ✅ Easy to install and use
- ✅ Runs on CPU (no GPU required)
- ✅ Small model size (~2GB for Llama 3.2 3B)

## Installation

### Windows

1. **Download Ollama**
   - Go to: https://ollama.com/download/windows
   - Click "Download for Windows"
   - Run the installer

2. **Verify Installation**
```
   ollama --version
```

3. **Pull the Model**
```
   ollama pull llama3.2:3b
```
   This will download the model (~2GB). Wait for completion.

4. **Test It**
```
   ollama run llama3.2:3b "What is a cyber incident?"
```

### Mac

1. **Install with Homebrew**
```bash
   brew install ollama
```

2. **Start Ollama Service**
```bash
   ollama serve
```
   Keep this running in a terminal.

3. **Pull the Model** (in a new terminal)
```bash
   ollama pull llama3.2:3b
```

4. **Test It**
```bash
   ollama run llama3.2:3b "What is a cyber incident?"
```

### Linux

1. **Install Ollama**
```bash
   curl -fsSL https://ollama.com/install.sh | sh
```

2. **Start as Service**
```bash
   ollama serve
```

3. **Pull the Model** (in a new terminal)
```bash
   ollama pull llama3.2:3b
```

4. **Test It**
```bash
   ollama run llama3.2:3b "What is a cyber incident?"
```

## Using with the Agent

Once Ollama is installed and the model is pulled:

1. Make sure Ollama is running (`ollama serve`)
2. Start the backend (`python main.py`)
3. The agent will automatically use Ollama for AI summaries

## If Ollama is Not Available

The agent will work without Ollama, but:
- AI summaries will be basic fallback text
- All other features work normally
- You can still run the full demo

## Checking Ollama Status
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# You should see a JSON response with available models
```

## Troubleshooting

**Ollama won't start:**
- Windows: Make sure it's installed as a service (should auto-start)
- Mac/Linux: Run `ollama serve` in a terminal

**Model not found:**
- Run: `ollama pull llama3.2:3b`
- Wait for download to complete

**Slow generation:**
- Normal for CPU - expect 20-30 seconds for summaries
- GPU support: Install CUDA toolkit (optional)

**Port already in use:**
- Default port is 11434
- Change with: `OLLAMA_HOST=0.0.0.0:11435 ollama serve`

## Alternative Models

If Llama 3.2 3B is too slow, try smaller models:
```bash
# Even smaller (faster but less accurate)
ollama pull llama3.2:1b

# Faster alternative
ollama pull phi3:mini
```

Edit `backend/llm_client.py` line 7 to change model:
```python
self.model = "phi3:mini"  # or "llama3.2:1b"
```