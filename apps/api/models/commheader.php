<?php
	// allows me to see all the errors so they can be fixed
	// will be turned off in a prouction environment
	error_reporting(E_ALL);
	ini_set('display_errors', "1");
	
	$currentFile = basename($_SERVER['SCRIPT_FILENAME']);
	$currentDate = date('Y-m-d');
	$extensionLoc = strpos($currentFile, ".");
	$pageName = substr($currentFile, 0, $extensionLoc);
	
	session_start();
	header('Content-Type: application/json');
	echo json_encode(['mode' => $_SESSION['mode']);
?>
<!DOCTYPE html lang="en-us">
<html>
	<head>
		<meta charset="utf-8">
		<meta name="author" content="Lucas Wedge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" 
		rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" 
		crossorigin="anonymous">
		<link id="base" rel="stylesheet" href="base.css">
		<?php
			if(isset($_SESSION['mode']))
			{
				if($_SESSION['mode'] == 'light')
				{
					echo '<link id="mode" rel="stylesheet" href="lightMode.css">';
				}
				else
				{
					echo '<link id="mode" rel="stylesheet" href="darkMode.css">';
				}
			}
			else
			{
				$_SESSION['mode'] = 'light';
				echo '<link id="mode" rel="stylesheet" href="lightMode.css">';
			}
		?>
		<title><?php echo ucfirst($pageName), PHP_EOL; ?></title>
	</head>
	<body>
		<header>
			<h1>CCU Commuting</h1>
			<nav>
				<span><?php echo ($currentFile == "parking.php") ? 'Parking' : '<a href="parking.php">Parking</a>'; ?></span>
				<span><?php echo ($currentFile == "stats.php") ? '<span>Stats</span>' : '<a href="stats.php">Stats</a>'; ?></span>
				<button type="button" class="rounded" id="color">Change Color Mode</button>
			</nav>
			<hr>
		</header>
