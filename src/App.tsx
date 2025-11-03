import './App.css'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Container, AppBar, Toolbar, Typography, Box, Snackbar, Button } from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import AddIcon from '@mui/icons-material/Add'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { hideSnackbar } from './store/uiSlice'
import RecipesList from './pages/RecipesList.tsx'
import RecipeBuilder from './pages/RecipeBuilder.tsx'
import CookSession from './pages/CookSession.tsx'
import MiniPlayer from './components/MiniPlayer.tsx'
import TimerController from './components/TimerController.tsx'

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const snackbar = useAppSelector((s) => s.ui.snackbar);
  const activeRecipeId = useAppSelector((s) => s.session.activeRecipeId);

  const showMini = !(
    location.pathname === `/cook/${activeRecipeId ?? ''}`
  ) && !!activeRecipeId;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <TimerController />
      <AppBar position="static">
        <Toolbar>
          <MenuBookIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ cursor: 'pointer' }} onClick={() => navigate('/recipes')}>
            Recipe Builder
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            color="inherit"
            variant="outlined"
            onClick={() => navigate('/recipes')}
            sx={{ ml: 3, borderColor: 'rgba(255,255,255,0.7)', '&:hover': { borderColor: '#fff' } }}
          >
            Show Recipes
          </Button>
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create')}
            sx={{ ml: 1, borderColor: 'rgba(255,255,255,0.7)', '&:hover': { borderColor: '#fff' } }}
          >
            Create Recipe
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<RecipesList />} />
          <Route path="/recipes" element={<RecipesList />} />
          <Route path="/create" element={<RecipeBuilder />} />
          <Route path="/cook/:id" element={<CookSession />} />
          <Route path="*" element={<Typography>Not Found</Typography>} />
        </Routes>
      </Container>

      {showMini && (
        <Box sx={{ position: 'fixed', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <MiniPlayer />
        </Box>
      )}

      <Snackbar
        open={!!snackbar}
        message={snackbar?.message}
        autoHideDuration={3000}
        onClose={() => dispatch(hideSnackbar())}
      />
    </Box>
  )
}

export default App
