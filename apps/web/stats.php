<?php include "commheader.php"; ?>
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
				<label>Email</label>
				<input type="text" id="email" name="email" placeholder="coolperson@coastal.edu">
			</p>
			<p>*insert interactive calendar and clock here*</p>
			<p>
				<label>Select A Parking Lot*</label>
				<?php include "dropdown.php"; ?>
			</p>
			<p>
				<label>Further Explanation</label>
				<textarea name="explain" rows=10 cols=30>Blah blah blah blah blah...</textarea>
			</p>
			<p><input type="submit" name="submit" id="submit" value="Submit"></p>
		</form>
	</section>
</main>
<?php include "commfooter.php"; ?>