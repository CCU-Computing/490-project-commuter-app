<?php 
	include "commheader.php";
	$showForm = TRUE;
	$errors = [];
	if($_SERVER['REQUEST_METHOD'] == "POST")
	{
		print_r($_POST);
		$firstName = trim($_POST['firstName']);
		$lastName = trim($_POST['lastName']);
		$email = trim($_POST['email']);
		$date = $_POST['date'];
		$time = $_POST['time'];
		$lot = $_POST['lot'];
		$percent = $_POST['percent'];
		$explain = trim($_POST['explain']);
		$showForm = FALSE;
	}
	if($showForm){
?>
<main>
	<section>
		<h2>Submit Statistics</h2>
		<p>
			Use the form below to submit parking statistics.<br>
			This data might be used to continue developing this web app!
		</p>
	</section>
	<section>
		<p>Note: The values with an asterisk (*) are required.</p>
		<form name="stats" id="stats" target="_blank" method="POST">
			<p>
				<label>First Name</label>
				<input type="text" id="first" name="first" placeholder="Jane">
			</p>
			<p>
				<label>Last Name</label>
				<input type="text" id="last" name="last" placeholder="Dough">
			</p>
			<p>
				<label>Email*</label>
				<input type="text" id="email" name="email" placeholder="coolperson@coastal.edu">
			</p>
			<p>
				<label>Date*</label>
				<input type="date" id="date" name="date" 
				value=<?php echo $currentDate?>
				min="2000-01-01" max=<?php echo $currentDate?>>
			</p>
			<p>
				<label>Time*</label>
				<input type="time" id="time" name="time">
			</p>
			<p>
				<label for="">Special Event?*</label><br>
				<input name="event" type="radio" id="yes" value="yes">
				<label id="label_yes" for="yes">Yes</label><br>
				<input name="event" type="radio" id="no" value="no">
				<label id="label_no" for="no">No</label>
			</p>
			<p>
				<label>Select A Parking Lot*</label>
				<?php include "dropdown.php"; ?>
			</p>
			<p>
				<label for="percent">Percentage Full*</label>
				<input type="number" name="percent" id="percent" min="0" max="100">
			</p>
			<p>
				<label>Further Explanation</label><br>
				<textarea id="explain" name="explain" rows=10 cols=30>Blah blah blah blah blah...</textarea>
			</p>
			<p><input type="submit" name="submit" id="submit" value="Submit"></p>
		</form>
	</section>
</main>
<?php
	} // end of if($showForm)
	include "commfooter.php"; 
?>
